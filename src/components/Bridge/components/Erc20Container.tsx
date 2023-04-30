import { ERC20 } from "@buildwithsygma/sygma-contracts";
import { ContractTransactionResponse, ethers } from "ethers";
import { Accessor, createEffect, createResource, createSignal } from "solid-js";
import { ConnectedResource } from "../Bridge";

export default function Erc20Container({
  resource,
  signer,
  bridge,
}: {
  resource: ConnectedResource;
  signer: Accessor<ethers.Signer>;
  bridge: string;
}) {
  const [amountToDeposit, setAmountToDeposit] = createSignal<string | null>(
    null,
  );
  const [amountToApprove, setAmountToApprove] = createSignal<string | null>(
    null,
  );

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

    return approveReceipt?.status
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

  const encodeDeposit = () => {
    
  }

  createEffect(() => {
    console.log("approveToTheBridge", approveToTheBridge());

  }, approveToTheBridge())

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
          <button type="submit">Deposit</button>
        </form>
      </div>
    </div>
  );
}
