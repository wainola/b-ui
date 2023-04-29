import { ERC20, ERC721 } from "@buildwithsygma/sygma-contracts";
import { A, useLocation, useRouteData } from "@solidjs/router";
import { ethers } from "ethers";
import { Accessor, createEffect, createSignal, For, onMount, Setter, Show, useContext } from "solid-js";
import { DomainsContext } from "../../App";
import { Domain } from "../../types";
import { resolveConnectionToResources } from "./utils";

export type ConnectedResource = Pick<Domain['resources'][0], "type" | "address" | "resourceId"> & { connected: boolean, contract: ERC20 | ERC721 }
export type ConnectedResources = Array<ConnectedResource>

export default function Bridge() {
  const { domains, setDomains, provider, signer } = useContext(DomainsContext) as {
    domains: Accessor<{ domains: Domain[] }| []>;
    setDomains: Setter<Domain[] | []>;
    provider: Accessor<ethers.BrowserProvider> | {};
    signer: Accessor<ethers.Signer> | {};
  };
  const [connectedResources, setConnectedResources] = createSignal<ConnectedResources | []>([])

  const routerData = useLocation()
  
  const { state } = routerData

  const domainSelected = (domains() as { domains: Domain[]}).domains.find((domain: Domain) => domain.id === state)

  const handleConnectResource = (resource: Domain['resources'][0]) => () => resolveConnectionToResources(resource, provider as ethers.BrowserProvider, setConnectedResources, connectedResources)

  createEffect(() => console.warn("Connected resources", Object.keys(connectedResources())))

  const renderConnectedSpan = (resource: Domain['resources'][0]) => {
    const resourceFound = connectedResources().find((connectedResource: ConnectedResource) => connectedResource.address === resource.address)
    if (resourceFound !== undefined) {
      return (<span style={{
        color: "white",
        width: "40px",
        height: "40px",
        background: "green",
      }}>Connected!</span>)
    } else {
      return (<button onClick={handleConnectResource(resource)}>Connect?</button>)
    }
  }

  return (
    <div>
      <h1>Bridge and resources!</h1>
      <Show when={domainSelected !== undefined} fallback={
        <div>Resource not found</div>
      }>
        <div>
          <h3>Bridge contract address: {(domainSelected as Domain).bridge}</h3>
          <table style={{
            border: "1px solid black",
          }}>
            <thead>
              <tr>
                <td>resource type</td>
                <td>resource addresss</td>
                <td>resource decimals</td>
                <td>resource resourceId</td>
                <td>resource symbol</td>
                <td>Connected?</td>
              </tr>
            </thead>
            <tbody>
              <For each={(domainSelected as Domain).resources}>
                {(resource: Domain['resources'][0]) => (
                  <tr>
                    <td>{resource.type}</td>
                    <td>{resource.address}</td>
                    <td>{resource.decimals}</td>
                    <td>{resource.resourceId}</td>
                    <td>{resource.symbol}</td>
                    <td>
                      <Show when={connectedResources().length !== 0} fallback={<button onClick={handleConnectResource(resource)}>Connect?</button> }>
                        {renderConnectedSpan(resource)}
                      </Show>
                      </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
      <A href="/">Back to home</A>
    </div>
  )
}