"use strict";
const express = require("express");

const db = require("../db");
const companiesRouter = new express.Router();

const { NotFoundError, BadRequestError } = require("../expressError");

/** Gets all companies, Returns list of companies, like
 *  {companies: [{code, name}, ...]} */
companiesRouter.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
        FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
});

/** Gets a single company, Return obj of company:
 *  {company: {code, name, description, invoices: [id, ...]}}.
 *  If company is not found, returns NotFoundError with status code of 404 */
companiesRouter.get("/:code", async function (req, res) {
  const code = req.params.code;
  const results = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [code]);
  const company = results.rows[0];
  if (company === undefined) {
    throw new NotFoundError();
  }

  const resultsInvoices = await db.query(
    `SELECT code, name, description
        FROM invoices
        JOIN companies
        ON invoices.comp_code = companies.code
        WHERE companies.code = $1`, [code]);

  const invoices = resultsInvoices.rows;
  company.invoices = invoices;

  return res.json({ company });
});

/** Tries to add a company, if successful returns obj of new company:
 *  {company: {code, name, description}}. If not, gives BadRequestError
 *  and status code of 400. */
companiesRouter.post("/", async function (req, res) {
  const { code, name, description } = req.body;

  try {
    const results = await db.query(
      `INSERT INTO companies (code, name, description)
              VALUES  ($1, $2, $3)
              RETURNING code, name, description`,
      [code, name, description]
    );

    const company = results.rows[0];
    return res.status(201).json({ company });
  } catch {
    throw new BadRequestError();
  }
});

/** Updates a company, if successful returns update company object:
 *  {company: {code, name, description}}.
 *  If not, returns NotFoundError with status code of 404. */
companiesRouter.put("/:code", async function (req, res) {
  const { name, description } = req.body;

  const results = await db.query(
    `UPDATE companies
        SET name = $1, description = $2
        WHERE code = $3
        RETURNING code, name, description`,
    [name, description, req.params.code],
  );

  const company = results.rows[0];

  if (company === undefined) {
    throw new NotFoundError();
  }

  return res.json({ company });
});

/** Deletes a company, if successful returns {status:'deleted'}.
 *  If not, returns NotFoundError with status code of 404.
 */
companiesRouter.delete("/:code", async function (req, res) {
  const results = await db.query(
    `DELETE FROM companies
        WHERE code = $1`, [req.params.code]);

  if (results.rowCount == 0) {
    throw new NotFoundError();
  }

  return res.json({ status: 'delete' });
});

module.exports = companiesRouter;
