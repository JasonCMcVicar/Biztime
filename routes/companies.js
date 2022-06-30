"use strict";
const express = require("express");

const db = require("../db");
const companiesRouter = new express.Router();

const { NotFoundError, BadRequestError } = require("../expressError");

companiesRouter.get("/", async function (req, res) {
  const results = await db.query(
    `SELECT code, name
        FROM companies`);
  const companies = results.rows;
  return res.json({ companies });
})

companiesRouter.get("/:code", async function (req, res) {
  const results = await db.query(
    `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [req.params.code]);
  const company = results.rows[0];
  if (company === undefined) {
    throw new NotFoundError();
  }
  return res.json({ company });
})

companiesRouter.post("/", async function (req, res) {
  const { code, name, description } = req.body;

  try {
    const results = await db.query(
      `INSERT INTO companies (code, name, description)
          VALUES  ($1, $2, $3)
          RETURNING code, name, description`,
      [code, name, description],
    );
    }
  catch {
    throw new BadRequestError();
  }
  const company = results.rows[0];
  return res.status(201).json({ company });

})

module.exports = companiesRouter;
