import { A } from "@solidjs/router";
import {
  createEffect,
  Show,
  For,
  useContext,
  Accessor,
  Setter,
} from "solid-js";
import { DomainsContext } from "../../App";
import { fetchBridgeSetup } from "../../bridgeSetup";
import { Domain } from "../../types";

export default function ContractLists() {
  const { domains, setDomains } = useContext(DomainsContext) as {
    domains: Accessor<{ domains: Domain[] }| []>;
    setDomains: Setter<Domain[] | []>;
  };

  const fetchConfig = async () => {
    const resources = await fetchBridgeSetup();

    setDomains(resources);
  };
  createEffect(() => {
    fetchConfig();
  });

  createEffect(() => console.log("Domains", domains()), domains());

  return (
    <div>
      <h1>Contract Lists</h1>
      <Show
        when={domains() !== null}
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
                <tr>
                  <td>{domain.id}</td>
                  <td>{domain.name}</td>
                  <td>
                    <A href={`/bridge/${domain.bridge}`} state={domain.id}>{domain.bridge}</A>
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
