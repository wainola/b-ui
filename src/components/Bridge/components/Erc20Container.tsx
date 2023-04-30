import {
  ERC20,
  FeeHandlerRouter,
  FeeHandlerRouter__factory,
} from "@buildwithsygma/sygma-contracts";
import {
  ContractTransactionResponse,
  ethers,
  TransactionReceipt,
} from "ethers";
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
import { fetchContractNameAndBalance, approveTheBridge, preparedDepositDataWithoutFee, fetchFeeHandlerAddress, requestFeeOracleFee, createFeeOracleData, FeeOracleResponse } from "../utils";

export default function Erc20Container({
  resource,
  signer,
  bridge,
  domains,
  chainId,
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
  }> => fetchContractNameAndBalance(resource, signer);

  const approve = async (
    amount: string,
  ): Promise<number> =>
    approveTheBridge(amount, resource, signer, bridge);

  const [contractName] = createResource(fethcContractName);
  const [approveToTheBridge] = createResource(amountToApprove, approve);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const amount = amountToDeposit();
    console.log(
      "🚀 ~ file: Erc20Container.tsx:30 ~ handleSubmit ~ amount:",
      amount,
    );
    setAmountToApprove(amount);
  };

  const prepareDepositData = async () => {
    const [encodedDepositData, destinationId, resourceId] =
      await preparedDepositDataWithoutFee(
        destination,
        resource,
        amountToDeposit,
        signer,
      );

    const currentDomainId = resourceIdtoChainId.find(
      (elem) => elem.chainId === chainId(),
    );

    const feeHandlerAddress = await fetchFeeHandlerAddress(
      domains,
      signer,
      currentDomainId!,
      resourceId,
      destinationId
    )

    console.log(
      "🚀 ~ file: Erc20Container.tsx:115 ~ prepareDepositData ~ feeHandlerAddress:",
      feeHandlerAddress,
    );

    const feeFromFeeOracle = await requestFeeOracleFee(
      currentDomainId?.id!,
      Number(destinationId),
      resourceId,
    )
    console.warn("🚀 ~ file: Erc20Container.tsx:99 ~ prepareDepositData ~ feeFromFeeOracle:", feeFromFeeOracle)

    const feeData: string = createFeeOracleData(
      feeFromFeeOracle as FeeOracleResponse,
      amountToDeposit() as string
    )

    const currentDomain = (domains() as { domains: Domain[] }).domains.find((domain: Domain) => domain.id === currentDomainId?.id)

    const typeOfFeeHandler = currentDomain?.feeHandlers.find((elem) => elem.address === feeHandlerAddress)
    console.log("🚀 ~ file: Erc20Container.tsx:109 ~ prepareDepositData ~ typeOfFeeHandler:", typeOfFeeHandler)

  };

  createEffect(() => {
    console.log("approveToTheBridge", approveToTheBridge());

    if (approveToTheBridge()) {
      prepareDepositData();
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
