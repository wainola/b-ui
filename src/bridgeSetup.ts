const url = import.meta.env.VITE_CONFIG_URL

export const fetchBridgeSetup = async () => {
  const response = await fetch(url!)
  const json = await response.json()
  return json
}