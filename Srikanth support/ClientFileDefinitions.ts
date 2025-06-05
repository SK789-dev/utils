import { ClientFileDefinition, ClientFileFieldDefinition } from "@/types/api";
import DataQualityApi from ".";

export const fetchFileDefinitions = async () => {
  const response = await DataQualityApi.get<ClientFileDefinition[]>(
    `/file-definitions`
  );
  return response?.data;
};

export const fetchFileDefinitionsByClientId = async (clientId: string) => {
  const response = await DataQualityApi.get<ClientFileDefinition[]>(
    `/clients/${clientId}/file-definitions`
  );
  return response?.data;
};

export async function createClientFileDefinitions(
  clientId: string,
  payload: ClientFileDefinition
) {
  const response = await DataQualityApi.post(
    `/clients/${clientId}/file-definitions`,
    payload
  );
  return response.data;
}
export const updateClientFileDefinition = (
  defId: string,
  payload: Partial<ClientFileDefinition>
) => {
  return DataQualityApi.put(`/file-definitions/${defId}`, payload);
};


export const createFieldDefinition = async (fileDefinitionId: string, fieldDefinition: ClientFileFieldDefinition) => {
const response = await DataQualityApi.post(
// `/client-file-definitions/${definitionId}/field-definitions`,
`/file-definitions/${fileDefinitionId}/field-definitions`,
fieldDefinition
);
return response.data;
};
export const updateFieldDefinition = async (id: string, updates: ClientFileFieldDefinition) => {
const response = await DataQualityApi.put(
`/field-definitions/${id}`,
updates
);
return response.data;
};
export const deleteFieldDefinition = async (id: string) => {
const response = await DataQualityApi.delete(`/field-definitions/${id}`);
return response.data;
};
export const associateFileDefinition = async (
   // clientId: string,
    data: {
        clientFileDefinition1Id: string;
        clientFileDefinition2Id: string;
    }
) => {
    const response = await DataQualityApi.post(
        `/associated-file-definitions`,
        data
    );
    return response.data;
};
