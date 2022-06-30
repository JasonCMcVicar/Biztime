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

/** Gets a single company, Return obj of company:
 *  {company: {code, name, description}}.
 *  If company is not found, returns NotFoundError with status code of 404 */
invoicesRouter.get("/:id", async function (req, res) {
  const id = req.params.id
  const resultsInvoice = await db.query(
    `SELECT id, amt, paid, paid_date
        FROM invoices
        WHERE id = $1`, [id]);
  const invoice = resultsInvoice.rows[0];
  if (invoice === undefined) {
    throw new NotFoundError();
  }
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

module.exports = invoicesRouter;
