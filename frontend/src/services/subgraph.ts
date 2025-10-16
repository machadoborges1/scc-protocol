/**
 * The URL for the Subgraph GraphQL API.
 * In a production environment, this should be stored in an environment variable.
 */
const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

/**
 * Performs a query against the Subgraph GraphQL API.
 * @param query The GraphQL query string.
 * @returns A promise that resolves to the JSON response from the API.
 * @throws An error if the network response is not ok.
 */
export const subgraphQuery = async <T>(query: string, variables?: Record<string, any>): Promise<T> => {
  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Subgraph query failed: ${response.statusText} - ${errorBody}`);
  }

  const json = await response.json();
  
  if (json.errors) {
    console.error("GraphQL Errors:", json.errors);
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
};
