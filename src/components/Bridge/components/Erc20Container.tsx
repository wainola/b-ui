import { ERC20, FeeHandlerRouter, FeeHandlerRouter__factory } from "@buildwithsygma/sygma-contracts";
import { ContractTransactionResponse, ethers } from "ethers";
import {
  Accessor,
  createEffect,
  createResource,
  createSignal,
  For,
} from "solid-js";
import { resourceIdtoChainId } from "../../../resourceIdToChainId";
import { Domain } from "../../../types";
import { ConnectedResource } from "../Bridge";

export default function Erc20Container({
  resource,
  signer,
  bridge,
  domains,
  chainId
}: {
  resource: ConnectedResource;
  signer: Accessor<ethers.Signer>;
  bridge: string;
  domains: Accessor<{ domains: Domain[] } | []>;
  chainId: Accessor<number | null>;
}) {
  const [amountToDeposit, setAmountToDeposit] = createSignal<string | null>(
    null,
  );
  const [amountToApprove, setAmountToApprove] = createSignal<string | null>(
    null,
  );

  const [destination, setDestination] = createSignal<string | null>(null);

  const fethcContractName = async (): Promise<{
    name: string;
    balance: string;
  }> => {
    const { contract, decimals } = resource;
    const currentSigner = signer();
    console.log(await currentSigner.getAddress());
    const connectedContract = contract.connect(currentSigner);
    const contractName = await connectedContract.name();
    const balance = ethers.formatUnits(
      await connectedContract.balanceOf(await currentSigner.getAddress()),
      decimals,
    );
    return { name: contractName, balance };
  };

  const approveToTheBridgeFunc = async (amount: string) => {
    const { contract } = resource;
    const currentSigner = signer();
    const connectedContract = contract.connect(currentSigner) as ERC20;
    const approve = (await connectedContract.approve(
      bridge,
      ethers.parseUnits(amount, resource.decimals),
    )) as ContractTransactionResponse;
    const approveReceipt = await approve.wait();

    return approveReceipt?.status;
  };

  const [contractName] = createResource(fethcContractName);
  const [approveToTheBridge] = createResource(
    amountToApprove,
    approveToTheBridgeFunc,
  );

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const amount = amountToDeposit();
    console.log(
      "🚀 ~ file: Erc20Container.tsx:30 ~ handleSubmit ~ amount:",
      amount,
    );
    setAmountToApprove(amount);

    // first approve to the bridge

    // then deposit
  };

  const preparedDepositDataWithoutFee = async (): Promise<[string, string, string]> => {
    const destinationId = destination();
    const resourceId = resource.resourceId;
    const amount = ethers.parseUnits(amountToDeposit() as string, resource.decimals);

    const signerAddress = await signer().getAddress();
    // this is for the encoding
    const addressToUin8Array = ethers.toBeArray(signerAddress);
    const parsedAmount = ethers.zeroPadValue(ethers.toBeHex(amount), 32)
    const lenSender = ethers.zeroPadValue(ethers.toBeHex(BigInt(addressToUin8Array.length)), 32)
    const depositData = ethers.concat([parsedAmount, lenSender, addressToUin8Array])
    const despositDataHex = ethers.hexlify(depositData)

    return [despositDataHex, destinationId as string, resourceId]
  };

  const prepareDepositData = async () => {
    const [encodedDepositData, destinationId, resourceId] = await preparedDepositDataWithoutFee()

    const currentDomainId = resourceIdtoChainId.find(elem => elem.chainId === chainId())

    const feeRouterInstance = FeeHandlerRouter__factory.connect(
      (domains() as { domains: Domain[] }).domains.find(domain => domain.id === Number(currentDomainId?.id))?.feeRouter as string,
      signer()
    ) as FeeHandlerRouter

    const feeHandlerAddress = await feeRouterInstance._domainResourceIDToFeeHandlerAddress(
      destinationId,
      resourceId
    )
    console.log("🚀 ~ file: Erc20Container.tsx:115 ~ prepareDepositData ~ feeHandlerAddress:", feeHandlerAddress)
  }

  createEffect(() => {
    console.log("approveToTheBridge", approveToTheBridge());

    if(approveToTheBridge()){
      prepareDepositData()
    }
  }, approveToTheBridge());




  return (
    <div>
      <h1>ERC20 Container</h1>
      <div>
        {resource.type} Connected?:{" "}
        {resource.connected ? (
          <span
            style={{
              color: "green",
            }}
          >
            {"Yes"}
          </span>
        ) : (
          <span
            style={{
              color: "green",
            }}
          >
            {"No"}
          </span>
        )}
      </div>
      <div>
        <form action="" onSubmit={handleSubmit}>
          <label>Balance of {contractName()?.name}</label>
          <input type="text" value={contractName()?.balance} />
          <label>Amount to deposit</label>
          <input
            type="text"
            placeholder="amount"
            onInput={(e) => setAmountToDeposit(e.target.value)}
          />
          <label>Destination {destination() || null}</label>
          <For each={resourceIdtoChainId} fallback={null}>
            {(elem) => (
              <div>
                <label>
                  {
                    (domains() as { domains: Domain[] }).domains.find(
                      (domain: Domain) => domain.id === elem.id,
                    )?.name
                  }
                </label>
                <input
                  type="checkbox"
                  value={elem.id}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </div>
            )}
          </For>
          <button type="submit">Deposit</button>
        </form>
      </div>
    </div>
  );
}
