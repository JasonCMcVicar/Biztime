"use strict";
const express = require("express");

const db = require("../db");
const invoicesRouter = new express.Router();

const { NotFoundError, BadRequestError } = require("../expressError");

/** Gets all invoices, Return list of invoices, like
 *  {invoices: [{id, comp_code}, ...]} */
invoicesRouter.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT id, comp_code
        FROM invoices`);
  const invoices = results.rows;
  return res.json({ invoices });
});

/** Gets a single invoice, Return obj of invoice:
 *  {invoice: {id, amt, paid, add_date, paid_date, company:
 *  {code, name, description}}.
 *  If company is not found, returns NotFoundError with status code of 404 */
invoicesRouter.get("/:id", async function (req, res) {
  const id = req.params.id;

  const resultsInvoice = await db.query(
    `SELECT id, amt, paid, paid_date
        FROM invoices
        WHERE id = $1`, [id]);

  const invoice = resultsInvoice.rows[0];
  //message here
  if (invoice === undefined) throw new NotFoundError();

  const resultsCompany = await db.query(
    `SELECT code, name, description
        FROM companies
        JOIN invoices
        ON invoices.comp_code = companies.code
        WHERE invoices.id = $1`, [id]);
  const company = resultsCompany.rows[0];

  invoice.company = company;
  return res.json({ invoice });
});

/** Tries to add a invoice, if successful returns obj of new invoice:
 *  {invoice: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}. */
invoicesRouter.post("/", async function (req, res) {
  const { comp_code, amt } = req.body;

  const results = await db.query(
    `INSERT INTO invoices (comp_code, amt)
        VALUES  ($1, $2)
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );

  const invoice = results.rows[0];
  return res.status(201).json({ invoice });
});

/** Updates a invoice, if successful returns update invoice object:
 *  {invoice: {id, comp_code, amt, paid, add_date, paid_date}}.
 *  If not, returns NotFoundError with status code of 404. */
invoicesRouter.put("/:id", async function (req, res) {
  const { amt } = req.body;
  const id = req.params.id;

  const resultsInvoice = await db.query(
    `SELECT comp_code, paid, add_date, paid_date
        FROM invoices
        WHERE id = $1`, [id]);

  const { comp_code, paid, add_date, paid_date } = resultsInvoice.rows[0];

  const resultsUpdate = await db.query(
    `UPDATE invoices
        SET id = $1, amt = $2, comp_code = $3, paid = $4, add_date = $5,
          paid_date = $6
        WHERE id = $1
        RETURNING id, amt, comp_code, paid, add_date, paid_date`,
    [id, amt, comp_code, paid, add_date, paid_date]
  );

  const invoice = resultsUpdate.rows[0];

  return res.json({ invoice });
});

/** Deletes a invoice, if successful returns {status:'deleted'}.
 *  If not, returns NotFoundError with status code of 404.
 */
invoicesRouter.delete("/:id", async function (req, res) {
  const id = req.params.id;

  const results = await db.query(
    `DELETE FROM invoices
        WHERE id = $1`, [id]);

  if (results.rowCount == 0) {
    throw new NotFoundError();
  }

  return res.json({ status: 'deleted' });
});

module.exports = invoicesRouter;
