const stripe = require("stripe")(process.env.STRIPE_API_KEY);
const orders = require("../models/ordersModel");
const users = require("../models/usersModel");

const PaymetGetaway = async (
  res,
  dbUser,
  ProductInfo,
  order,
  successURL,
  cancelURL
) => {
  try {
    const customers = await stripe.customers.list({});
    const stripe_customer = customers.data.find((cust) => {
      return cust.name === dbUser._id;
    });
    if (stripe_customer && Object.values(stripe_customer).length > 0) {
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: ProductInfo.description,
              },

              unit_amount: order.total_amount * 100,
            },
            quantity: ProductInfo.count,
          },
        ],
        payment_intent_data: {
          setup_future_usage: "off_session",
        },
        phone_number_collection: { enabled: true },
        custom_text: {
          after_submit: { message: order._id },
        },
        mode: "payment",
        invoice_creation: {
          enabled: true,
        },
        // metadata: {
        //   plan: plan,
        // },
        // allow_promotion_codes: true,
        billing_address_collection: "required",
        // shipping_address_collection: {
        //   allowed_countries: ['US', 'CA', ],
        // },
        customer: stripe_customer.id,
        // customer_email:findCustomers.email,
        // email:session.customer_email,
        success_url: successURL,
        cancel_url: cancelURL,
      });
      await orders.updateOne(
        { _id: order._id },
        { $set: { session_id: session.id } }
      );

      return res.status(200).json({
        response_code: 200,
        PaymentURL: session.url,
        message: "Session created successfully",
      });
    } else {
      const new_customer = await stripe.customers.create({
        name: dbUser._id,
        email: dbUser.email,
      });
      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: ProductInfo.description,
              },

              unit_amount: order.total_amount * 100,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: {
          setup_future_usage: "off_session",
        },
        phone_number_collection: { enabled: true },
        custom_text: {
          after_submit: { message: order._id },
        },
        mode: "payment",
        invoice_creation: {
          enabled: true,
        },
        // metadata: {
        //   plan: plan,
        // },
        // allow_promotion_codes: true,
        billing_address_collection: "required",
        // shipping_address_collection: {
        //   allowed_countries: ['US', 'CA', ],
        // },
        customer: new_customer.id,
        // customer_email:findCustomers.email,
        // email:session.customer_email,
        success_url: successURL,
        cancel_url: cancelURL,
      });
      await orders.updateOne(
        { _id: order._id },
        { $set: { session_id: session.id } }
      );

      return res.status(200).json({
        response_code: 200,
        PaymentURL: session.url,
        seesion_id: session.id,
        message: "Session created successfully",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Stripe error" });
  }
};

const payCheck = async (req, res) => {
  try {
    const { session_id, order_id } = req.body;
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const order = await orders.findOne({ _id: order_id });
    if (!order) {
      return res
        .status(404)
        .json({ response_code: 404, message: "Order not found" });
    }
    await orders.updateOne(
      { _id: order_id },
      {
        $set: {
          payment_status: session.payment_status,
          payment_date: new Date(),
        },
      }
    );

    if (session.payment_status === "paid") {
      /* receipt Url */
      const payment_intent = await stripe.paymentIntents.retrieve(
        session.payment_intent
      );
      const charge = await stripe.charges.retrieve(
        payment_intent.latest_charge
      );
      /* Alternate option to receipt URL */
      //   const invoice = await stripe.invoices.retrieve(session.invoice);

      await orders.updateOne(
        { _id: order._id },
        {
          $set: {
            invoice: charge.receipt_url,
            // invoice: invoice.hosted_invoice_url,
            card_details: charge.payment_method_details.card,
          },
        }
      );
      const dbUser = await users.findOne({ username: req.username });
      if (!dbUser) {
        return res.status(300).json({
          response_code: 300,
          message: "Invalid user or missing token",
        });
      }
      if (!dbUser.orders.includes(order_id)) {
        await users.updateOne(
          { username: req.username },
          { $push: { orders: order._id } }
        );
      }
      return res
        .status(200)
        .json({ response_code: 200, message: "payment updated Successfully" });
    }
    res
      .status(200)
      .json({ response_code: 200, message: "session added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const PaymentApis = { PaymetGetaway, payCheck };
module.exports = PaymentApis;
