const url = 'https://cloudflare-ipfs.com/ipfs/QmciQFVzJtNEM77QCPR7MNc7pDhucmbHt3FLk8RsMW2SMr'

export const fetchBridgeSetup = async () => {
  const response = await fetch(url)
  const json = await response.json()
  return json
}