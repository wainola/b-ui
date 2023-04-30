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
  
  const fethcContractName = async (): Promise<string> => {
    const { contract } = resource
    const currentSigner = signer()
    console.log(await currentSigner.getAddress())
    const connectedContract = contract.connect(currentSigner)
    const contractName = await connectedContract.balanceOf(await currentSigner.getAddress())
    console.log("🚀 ~ file: Erc20Container.tsx:19 ~ fethcContractName ~ contractName:", contractName)
    return contractName
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
          <label>Balance of {contractName()}</label>
          <input type="text" value='100'/>

        </form>
      </div>
    </div>
  );
}
