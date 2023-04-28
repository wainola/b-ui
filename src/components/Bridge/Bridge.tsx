import { A, useLocation, useRouteData } from "@solidjs/router";
import { Accessor, For, Setter, Show, useContext } from "solid-js";
import { DomainsContext } from "../../App";
import { Domain } from "../../types";

export default function Bridge() {
  const { domains, setDomains } = useContext(DomainsContext) as {
    domains: Accessor<{ domains: Domain[] }| []>;
    setDomains: Setter<Domain[] | []>;
  };

  const routerData = useLocation()
  
  const { state } = routerData

  const domainSelected = (domains() as { domains: Domain[]}).domains.find((domain: Domain) => domain.id === state)
  
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