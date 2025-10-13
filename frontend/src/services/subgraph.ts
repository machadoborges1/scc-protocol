/**
 * The URL for the Subgraph GraphQL API.
 * In a production environment, this should be stored in an environment variable.
 */
const SUBGRAPH_URL = "http://127.0.0.1:8000/subgraphs/name/scc/scc-protocol";

/**
 * Performs a query against the Subgraph GraphQL API.
 * @param query The GraphQL query string.
 * @returns A promise that resolves to the JSON response from the API.
 * @throws An error if the network response is not ok.
 */
export const subgraphQuery = async <T>(query: string): Promise<T> => {
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Subgraph query failed: ${response.statusText} - ${errorBody}`);
  }

  const json = await response.json();
  
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
};
