import { DynamicERC20FeeHandlerEVM, DynamicERC20FeeHandlerEVM__factory, ERC20, ERC20__factory, FeeHandlerRouter, FeeHandlerRouter__factory } from "@buildwithsygma/sygma-contracts";
import { ContractTransactionResponse, ethers, TransactionReceipt } from "ethers";
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

  setConnectedResources([
    ...connectedResources(),
    {
      type: resource.type,
      address: resource.address,
      contract: erc20Contract as ERC20,
      resourceId: resource.resourceId,
      connected: true
    } as ConnectedResource
  ])

}

const connectErc20Contract = (address: string, provider: ethers.BrowserProvider): ERC20 => {
  const Erc20Contract = ERC20__factory.connect(address, provider)
  return Erc20Contract
}

export const fetchContractNameAndBalance = async (resource: ConnectedResource, signer: Accessor<ethers.Signer>): Promise<{
  name: string;
  balance: string;
}> => {
  const { contract, decimals } = resource;
  const currentSigner = signer();
  const connectedContract = contract.connect(currentSigner);
  const contractName = await connectedContract.name();
  const balance = ethers.formatUnits(
    await connectedContract.balanceOf(await currentSigner.getAddress()),
    decimals,
  );
  return { name: contractName, balance };
};

export const approveTheBridge = async (amount: string, resource: ConnectedResource, signer: Accessor<ethers.Signer>, bridge: string): Promise<number> => {
  const { contract } = resource;
  const currentSigner = signer();
  const connectedContract = contract.connect(currentSigner) as ERC20;
  const approve = (await connectedContract.approve(
    bridge,
    ethers.parseUnits(amount, resource.decimals),
  )) as ContractTransactionResponse;
  const approveReceipt = await approve.wait();

  return approveReceipt?.status as number;
};

export const preparedDepositDataWithoutFee = async (
  destination: Accessor<string | null>,
  resource: ConnectedResource,
  amountToDeposit: Accessor<string | null>,
  signer: Accessor<ethers.Signer>,
): Promise<
  [string, string, string]
> => {
  const destinationId = destination();
  const resourceId = resource.resourceId;
  const amount = ethers.parseUnits(
    amountToDeposit() as string,
    resource.decimals,
  );

  const signerAddress = await signer().getAddress();
  // this is for the encoding
  const addressToUin8Array = ethers.toBeArray(signerAddress);
  const parsedAmount = ethers.zeroPadValue(ethers.toBeHex(amount), 32);
  const lenSender = ethers.zeroPadValue(
    ethers.toBeHex(BigInt(addressToUin8Array.length)),
    32,
  );
  const depositData = ethers.concat([
    parsedAmount,
    lenSender,
    addressToUin8Array,
  ]);
  const despositDataHex = ethers.hexlify(depositData);

  return [despositDataHex, destinationId as string, resourceId];
};

export const fetchFeeHandlerAddress = async (domains: Accessor<{ domains: Domain[] } | [] >, signer: Accessor<ethers.Signer>, currentDomainId: { id: number, chainId: number }, resourceId: string, destinationId: string): Promise<string> => {

  const feeRouterInstance = FeeHandlerRouter__factory.connect(
    (domains() as { domains: Domain[] }).domains.find(
      (domain) => domain.id === Number(currentDomainId?.id),
    )?.feeRouter as string,
    signer(),
  ) as FeeHandlerRouter;

  const feeHandlerAddress =
    await feeRouterInstance._domainResourceIDToFeeHandlerAddress(
      destinationId,
      resourceId,
    );

  return feeHandlerAddress
}

export const requestFeeOracleFee = async (
  fromDomainId: number,
  toDomainId: number,
  resourceId: string,
  msgGasLimit?: number
) => {
  const { VITE_FEE_ORACLE_URL } = import.meta.env
  const response = await fetch(`${VITE_FEE_ORACLE_URL}/v1/rate/from/${fromDomainId}/to/${toDomainId}/resourceid/${resourceId}?gasLimit=${msgGasLimit || 0}`, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  })
  
  const data = await response.json()

  return data.response
}

export type FeeOracleResponse = { baseEffectiveRate: string, tokenEffectiveRate: string, dstGasPrice: string, expirationTimestamp: number, fromDomainID: number, toDomainID: number, resourceID: string, msgGasLimit: number, signature: string }

export const createFeeOracleData = (oracleResponse: FeeOracleResponse , amount: string): string => {
  const oracleData = ethers.solidityPacked([
    'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'uint256', 'bytes32', 'uint256'
  ], [
    ethers.parseEther(oracleResponse.baseEffectiveRate),
    ethers.parseEther(oracleResponse.tokenEffectiveRate),
    ethers.parseUnits(oracleResponse.dstGasPrice, 'wei'),
    oracleResponse.expirationTimestamp,
    oracleResponse.fromDomainID,
    oracleResponse.toDomainID,
    oracleResponse.resourceID,
    oracleResponse.msgGasLimit
  ])

  const signature = oracleResponse.signature
  return oracleData + signature + ethers.toBeHex(amount, 32).substring(2)
}

export const calculateDynamicFee = async (feeHandlerWithOracle: DynamicERC20FeeHandlerEVM, sender: string, fromDomainId: string, toDomainId: string, resourceId: string, depositData: string, feeData: string) => {
  const res = await feeHandlerWithOracle.calculateFee(
    sender,
    fromDomainId,
    toDomainId,
    resourceId,
    depositData,
    feeData
  )
  console.log("🚀 ~ file: utils.ts:158 ~ calculateDynamicFee ~ res:", res)

}