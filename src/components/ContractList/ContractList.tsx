import { createEffect, createSignal, Show, For } from "solid-js";
import { fetchBridgeSetup } from "../../bridgeSetup";

type Domain = {
  id: number;
  name: string;
  type: string;
  bridge: string;
  handlers: Array<{
    type: string,
    address: string
  }>;
  nativeTokenSymbol: string;
  nativeTokenDecimals: number;
  nativeTokenFullName: string;
  startBlock: number;
  blockConfirmations: number;
  feeRouter: string;
  feeHandlers: Array<{ address: string, type: 'basic' | 'oracle' }>;
  resources: Array<{ resourceId: string, type: string, address: string, symbol: string, decimals: number }>;
}

export default function ContractLists () {
  const [domains, setDomains] = createSignal<{ domains: Domain[] } | null>(null);

  const fetchConfig = async () => {
    const resources = await fetchBridgeSetup()

    setDomains(resources)
  }
  createEffect(() => {
    fetchConfig()
  })
  
  createEffect(() => console.log("Domains", domains()), domains())

  return (
    <div>
      <h1>Contract Lists</h1>
      <Show when={domains() !== null} fallback={
        <div>
          Loading contract list...
        </div>
      }>
        <For each={domains()!.domains}>
          {(domain: Domain) => (
            <div>
              <span>Domain id: {domain.id}</span>
            </div>
          )}
        </For>
      </Show>
    </div>
  )
}