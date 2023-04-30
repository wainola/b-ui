import { A } from "@solidjs/router";
import {
  createEffect,
  Show,
  For,
  useContext,
  Accessor,
  Setter,
  createSignal,
} from "solid-js";
import { DomainsContext } from "../../App";
import { fetchBridgeSetup } from "../../bridgeSetup";
import { resourceIdtoChainId } from "../../resourceIdToChainId";
import { Domain } from "../../types";

export default function ContractLists({ chainId }: { chainId: Accessor<number | null>}) {
  const { domains, setDomains } = useContext(DomainsContext) as {
    domains: Accessor<{ domains: Domain[] }| []>;
    setDomains: Setter<Domain[] | []>;
  };
  const [currentChainId, setCurrentChainId] = createSignal<{id: number | undefined, chainId: number | undefined }>({
    id: undefined,
    chainId: undefined
  })

  const fetchConfig = async () => {
    const resources = await fetchBridgeSetup();

    setDomains(resources);
  };
  createEffect(() => {
    fetchConfig();
  });

  createEffect(() => {
    const updatedDomains = domains();

    if ('domains' in updatedDomains && chainId() !== null) {
      const chainIdPerId = resourceIdtoChainId.find((resource) => resource.chainId === chainId())

      const curentIdPerChainId = updatedDomains.domains.find((domain: Domain) => domain.id === chainIdPerId?.id)
      
      const objToSet = { id: curentIdPerChainId?.id, chainId: chainId() }

      setCurrentChainId(
        objToSet as {id: number, chainId: number}
      )
    }
  
  }, domains());

  createEffect(() => {
    console.warn(currentChainId())
  })


  return (
    <div>
      <h1>Contract Lists</h1>
      <Show
        when={chainId() !== null && domains() !== null}
        fallback={<div>Loading contract list...</div>}
      >
        <table
          style={{
            border: "1px solid black",
          }}
        >
          <thead>
            <tr>
              <td>id</td>
              <td>name</td>
              <td>bridge</td>
              <td>native token symbol</td>
              <td>Network type</td>
              <td>Resources</td>
            </tr>
          </thead>
          <tbody>
            <For each={(domains() as { domains: Domain[]})!.domains}>
              {(domain: Domain) => (
                <tr style={{ background: currentChainId().id === domain.id ? "blue" : "unset", color: currentChainId().id === domain.id ? "white" : "unset" }}>
                  <td>{domain.id}</td>
                  <td>{domain.name}</td>
                  <td>
                    <A href={`/bridge/${domain.bridge}`} state={domain.id} style={{
                      color: currentChainId().id === domain.id ? "white" : "unset" 
                    }}>{domain.bridge}</A>
                  </td>
                  <td>{domain.nativeTokenSymbol}</td>
                  <td>{domain.type}</td>
                  <td>{domain.resources.length}</td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>
    </div>
  );
}
