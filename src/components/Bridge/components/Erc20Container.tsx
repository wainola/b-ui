import { ConnectedResource } from "../Bridge";

export default function Erc20Container({
  resource,
}: {
  resource: ConnectedResource;
}) {
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
    </div>
  );
}
