import { ConnectedResource } from "../Bridge";

export default function Erc721Container({ resource}: { resource: ConnectedResource }){
  return (
    <div>
      <h1>ERC721 Container</h1>
      <h3>{resource.type}</h3>
    </div>
  )
}