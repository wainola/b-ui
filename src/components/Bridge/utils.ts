import { ERC20, ERC20__factory } from "@buildwithsygma/sygma-contracts";
import { ethers } from "ethers";
import { Accessor, Setter } from "solid-js";
import { Domain } from "../../types";
import { ConnectedResource, ConnectedResources } from "./Bridge";

export const resolveConnectionToResources = (resource: Domain['resources'][0], provider: ethers.BrowserProvider, setConnectedResources: Setter<ConnectedResources | []>, connectedResources: Accessor<ConnectedResources | []>) => {
  let erc20Contract: ERC20 | null = null;
  switch (resource.type) {
    case 'erc20':
      erc20Contract = connectErc20Contract(resource.address, provider);
    default:
      null;
  }

  setConnectedResources((current) => {
    const c = {
      type: resource.type,
      address: resource.address,
      contract: erc20Contract as ERC20,
      resourceId: resource.resourceId,
      connected: true
    } as ConnectedResource

    (current as ConnectedResources).push(c);

    return current;
  })
}

const connectErc20Contract = (address: string, provider: ethers.BrowserProvider): ERC20 => {
  const Erc20Contract = ERC20__factory.connect(address, provider)
  return Erc20Contract
}