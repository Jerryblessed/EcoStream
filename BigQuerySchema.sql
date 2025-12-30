CREATE SCHEMA IF NOT EXISTS ecostream_dataset;

CREATE TABLE IF NOT EXISTS ecostream_dataset.logs (
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_email STRING,
    user_name STRING,
    user_prompt STRING,
    market_name STRING,
    carbon_saved FLOAT64
);