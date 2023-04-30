import { ethers } from "ethers";
import { Accessor, createResource, createSignal } from "solid-js";
import { ConnectedResource } from "../Bridge";

export default function Erc20Container({
  resource,
  signer
}: {
  resource: ConnectedResource;
  signer: Accessor<ethers.Signer>;
}) {
  
  const fethcContractName = async (): Promise<{name: string, balance: string }> => {
    const { contract, decimals } = resource
    const currentSigner = signer()
    console.log(await currentSigner.getAddress())
    const connectedContract = contract.connect(currentSigner)
    const contractName = await connectedContract.name()
    const balance = ethers.formatUnits(await connectedContract.balanceOf(await currentSigner.getAddress()), decimals)
    return { name: contractName, balance }
  }

  const [contractName] = createResource(fethcContractName)

  return (
    <div>
      <h1>ERC20 Container</h1>
      <div>
        {resource.type} Connected?:{" "}
        {resource.connected ? (
          <span
            style={{
              color: "green"
            }}
          >{'Yes'}</span>
        ) : (
          <span
            style={{
              color: "green"
            }}
          >{'No'}</span>
        )}
      </div>
      <div>
        <form action="">
          <label>Balance of {contractName()?.name}</label>
          <input type="text" value={contractName()?.balance}/>
          <label>Amount to deposit</label>
          <input type="text" placeholder="amount"/>

        </form>
      </div>
    </div>
  );
}
