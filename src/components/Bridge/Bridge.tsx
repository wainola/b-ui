import { ERC20, ERC721 } from "@buildwithsygma/sygma-contracts";
import { A, useLocation, useRouteData } from "@solidjs/router";
import { ethers } from "ethers";
import {
  Accessor,
  createEffect,
  createSignal,
  For,
  lazy,
  onMount,
  Setter,
  Show,
  useContext,
} from "solid-js";
import { DomainsContext } from "../../App";
import { Domain } from "../../types";
import { resolveConnectionToResources } from "./utils";

export type ConnectedResource = Pick<
  Domain["resources"][0],
  "type" | "address" | "resourceId" | "decimals"
> & { connected: boolean; contract: ERC20 | ERC721 };
export type ConnectedResources = Array<ConnectedResource>;

export default function Bridge({
  chainId,
}: {
  chainId: Accessor<number | null>;
}) {
  const { domains, setDomains, provider, signer } = useContext(
    DomainsContext,
  ) as {
    domains: Accessor<{ domains: Domain[] } | []>;
    setDomains: Setter<Domain[] | []>;
    provider: Accessor<ethers.BrowserProvider> | {};
    signer: Accessor<ethers.Signer> | {};
  };
  const [connectedResources, setConnectedResources] = createSignal<
    ConnectedResources | []
  >([]);

  const routerData = useLocation();

  const { state } = routerData;

  const domainSelected = (domains() as { domains: Domain[] }).domains.find(
    (domain: Domain) => domain.id === state,
  );

  const handleConnectResource = (resource: Domain["resources"][0]) => () =>
    resolveConnectionToResources(
      resource,
      provider as ethers.BrowserProvider,
      setConnectedResources,
      connectedResources,
    );

  createEffect(() =>
    console.warn("Connected resources", Object.keys(connectedResources())),
  );

  const renderConnectedSpan = (resource: Domain["resources"][0]) => {
    const resourceFound = connectedResources().find(
      (connectedResource: ConnectedResource) =>
        connectedResource.address === resource.address,
    );
    if (resourceFound !== undefined) {
      return (
        <span
          style={{
            color: "white",
            width: "40px",
            height: "40px",
            background: "green",
          }}
        >
          Connected!
        </span>
      );
    } else {
      return (
        <button onClick={handleConnectResource(resource)}>Connect?</button>
      );
    }
  };

  const renderContractsContainers = () => {
    const resources = connectedResources();
    const erc20Resources = resources.filter(
      (resource: ConnectedResource) => resource.type === "erc20",
    );
    const erc721Resources = resources.filter(
      (resource: ConnectedResource) => resource.type === "erc721",
    );

    const erc20Components =
      erc20Resources.length !== 0 &&
      erc20Resources.map((resource: ConnectedResource) =>
        lazy(() => import("./components/Erc20Container")),
      );

    const erc721Components =
      erc721Resources.length !== 0 &&
      erc721Resources.map((resource: ConnectedResource) =>
        lazy(() => import("./components/Erc721Container")),
      );

    const resolvedErc20Containers =
      erc20Components &&
      erc20Components.map((Erc20Container: any, index: number) => (
        <Erc20Container
          resource={erc20Resources[index]}
          signer={signer}
          bridge={domainSelected?.bridge}
          domains={domains}
          chainId={chainId}
        />
      ));

    const resolvedErc721Containers =
      erc721Components &&
      erc721Components.map((Erc721Container: any, index: number) => (
        <Erc721Container resource={erc721Resources[index]} />
      ));

    return [resolvedErc20Containers, resolvedErc721Containers];
  };

  return (
    <div>
      <h1>Bridge and resources!</h1>
      <Show
        when={domainSelected !== undefined}
        fallback={<div>Resource not found</div>}
      >
        <div>
          <h3>Bridge contract address: {(domainSelected as Domain).bridge}</h3>
          <table
            style={{
              border: "1px solid black",
            }}
          >
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
                {(resource: Domain["resources"][0]) => (
                  <tr>
                    <td>{resource.type}</td>
                    <td>{resource.address}</td>
                    <td>{resource.decimals}</td>
                    <td>{resource.resourceId}</td>
                    <td>{resource.symbol}</td>
                    <td>
                      <Show
                        when={connectedResources().length !== 0}
                        fallback={
                          resource.address === "" ? (
                            <span>Can't connect, no address</span>
                          ) : (
                            <button onClick={handleConnectResource(resource)}>
                              Connect?
                            </button>
                          )
                        }
                      >
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
      <Show when={connectedResources().length !== 0} fallback={null}>
        {renderContractsContainers()}
      </Show>
      <A href="/">Back to home</A>
    </div>
  );
}
