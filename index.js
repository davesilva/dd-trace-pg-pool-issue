require('dd-trace').init()

const express = require('express')
const { Pool } = require('pg')
const app = express()

// This happens with any pool size but creating a pool with only
// one connection in it makes it easier to trigger.
const pool = new Pool({ max: 1 })

app.get('/correct-trace', async (req, res) => {
  // Querying from the pool the long way results in pg spans attached
  // to the correct traces:
  const client = await pool.connect()
  await client.query('SELECT NOW()')
  client.release()

  res.sendStatus(204)
})

app.get('/wrong-trace', async (req, res) => {
  // ...but using the shorthand results in pg spans appearing in
  // the wrong parent trace any time this query has to wait in
  // the pg-pool queue for a client to become available.
  await pool.query('SELECT pg_sleep(5)')

  res.sendStatus(204)
})

const port = 3000
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
