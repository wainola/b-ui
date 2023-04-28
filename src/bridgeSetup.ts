import dotenv from 'dotenv'

dotenv.config({
  path: `${process.cwd()}/.env`
})

const url = process.env.CONFIG_URL

export const fetchBridgeSetup = async () => {
  const response = await fetch(url!)
  const json = await response.json()
  return json
}