import { ethers } from 'ethers'

export const getProvider = (provider: ethers.Eip1193Provider) => {
  return new ethers.BrowserProvider(provider)
}

export const getSigner = async (provider: ethers.BrowserProvider, address: string) => {
  return await provider.getSigner(address)
}

export const formatBalance = (balance: bigint) => {
  return ethers.formatEther(balance)
}