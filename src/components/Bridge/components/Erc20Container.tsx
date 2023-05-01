import {
  BasicFeeHandler__factory,
  Bridge__factory,
  DynamicERC20FeeHandlerEVM__factory,
  ERC20,
} from "@buildwithsygma/sygma-contracts";
import { ethers } from "ethers";
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
import {
  fetchContractNameAndBalance,
  approveTheBridge,
  preparedDepositDataWithoutFee,
  fetchFeeHandlerAddress,
  requestFeeOracleFee,
  createFeeOracleData,
  FeeOracleResponse,
  calculateDynamicFee,
  depositToBridge,
  approveTheHandler,
} from "../utils";

export default function Erc20Container({
  resource,
  signer,
  bridge,
  domains,
  chainId,
  provider,
}: {
  resource: ConnectedResource;
  signer: Accessor<ethers.Signer>;
  bridge: string;
  domains: Accessor<{ domains: Domain[] } | []>;
  chainId: Accessor<number | null>;
  provider: Accessor<ethers.BrowserProvider | null>;
}) {
  const [amountToDeposit, setAmountToDeposit] = createSignal<string | null>(
    null,
  );
  const [amountToApprove, setAmountToApprove] = createSignal<string | null>(
    null,
  );

  const [destination, setDestination] = createSignal<string | null>(null);
  
  const [handlerToApprove, setHandlerToApprove] = createSignal<string | null>(null)

  const fethcContractName = async (): Promise<{
    name: string;
    balance: string;
  }> => fetchContractNameAndBalance(resource, signer);

  const approve = async (amount: string): Promise<number> =>
    approveTheBridge(amount, resource, signer, bridge);

  const approveToTheHandler = async (amount: string) =>
    approveTheHandler(amount, resource, signer, handlerToApprove()!);

  const [contractName] = createResource(fethcContractName);
  const [approveERC20Handler] = createResource(amountToApprove, approveToTheHandler);

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const amount = amountToDeposit();
    
    const domainId = resourceIdtoChainId.find((elem) => elem.chainId === chainId());
    
    const typeOfHandlerToApprove = (domains() as { domains: Domain[] }).domains.find((domain: Domain) => domain.id === domainId?.id)
    
    const { handlers } = typeOfHandlerToApprove!;
    
    const handler = handlers.find((elem) => elem.type === resource.type);
    
    setHandlerToApprove(handler?.address!);
    
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
      destinationId,
    );

    const currentDomain = (domains() as { domains: Domain[] }).domains.find(
      (domain: Domain) => domain.id === currentDomainId?.id,
    );

    const typeOfFeeHandler = currentDomain?.feeHandlers.find(
      (elem) => elem.address === feeHandlerAddress,
    );
    console.log(
      "🚀 ~ file: Erc20Container.tsx:109 ~ prepareDepositData ~ typeOfFeeHandler:",
      typeOfFeeHandler,
    );

    const { type } = typeOfFeeHandler!;
    console.log(
      "🚀 ~ file: Erc20Container.tsx:96 ~ prepareDepositData ~ type:",
      type,
    );

    let feeFromFeeOracle;

    if (type === "oracle") {
      feeFromFeeOracle = await requestFeeOracleFee(
        currentDomainId?.id!,
        Number(destinationId),
        resourceId,
      );
    }

    const bridgeInstance = Bridge__factory.connect(bridge, signer());

    if (type === "oracle") {
      const feeData: string = createFeeOracleData(
        feeFromFeeOracle as FeeOracleResponse,
        amountToDeposit() as string,
      );

      const feeHandler = DynamicERC20FeeHandlerEVM__factory.connect(
        feeHandlerAddress,
        signer(),
      );
      const calculatedFee = await calculateDynamicFee(
        feeHandler,
        await signer().getAddress(),
        currentDomainId?.id!,
        Number(destinationId),
        resourceId,
        encodedDepositData,
        feeData,
      );
      console.log(
        "🚀 ~ file: Erc20Container.tsx:125 ~ prepareDepositData ~ calculatedFee:",
        calculatedFee,
      );

      const gasPrice = await provider()?.getFeeData();
      console.log(
        "🚀 ~ file: Erc20Container.tsx:131 ~ prepareDepositData ~ gasPrice:",
        gasPrice,
      );

      await depositToBridge(
        bridgeInstance,
        Number(destinationId),
        resourceId,
        { feeData: calculatedFee.feeData, feeValue: calculatedFee.fee },
        encodedDepositData,
        gasPrice!,
        type,
      );
    } else {
      const basicFeeHandler = BasicFeeHandler__factory.connect(
        feeHandlerAddress,
        signer(),
      );
      const feeData = "0x00";
      const calculatedFee = await basicFeeHandler.calculateFee(
        await signer().getAddress(),
        currentDomainId?.id!,
        Number(destinationId),
        resourceId,
        encodedDepositData,
        feeData,
      );

      const [fee, address] = calculatedFee;
      const feeDataToUse = ethers.toBeHex(fee);

      const gasPrice = await provider()?.getFeeData();

      await depositToBridge(
        bridgeInstance,
        Number(destinationId),
        resourceId,
        { feeData: feeDataToUse, feeValue: fee },
        encodedDepositData,
        gasPrice!,
        type,
      );
    }
  };

  createEffect(() => {
    console.log("approveToTheBridge", handlerToApprove());

    if (approveERC20Handler()) {
      prepareDepositData();
    }
  }, approveERC20Handler());

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
