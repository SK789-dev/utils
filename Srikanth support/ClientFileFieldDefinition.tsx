import type { ClientFileFieldDefinition } from "@/types/api";
import {
    Box,
    Container
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFieldDefinition, updateFieldDefinition, deleteFieldDefinition } from "@/api/ClientFileDefinitions";
import { fetchFieldTypes } from "@/api/enum";
import { ClientFieldDefinitionManager } from "./FieldDefinitionComponents";

interface ClientFieldDefinitionListProps {
    fieldDefinitions?: ClientFileFieldDefinition[];
    fileDefinitionName?: string;
    fileType?: string;
    clientFileDefinitionId?: string;
}

function ClientFileFieldDefinitionList({
    fieldDefinitions,
    fileDefinitionName,
    fileType,
    clientFileDefinitionId,
}: ClientFieldDefinitionListProps) {
    const queryClient = useQueryClient();

    // Add query for field types
    const { data: fieldTypes = [] } = useQuery({
        queryKey: ["fieldTypes"],
        queryFn: fetchFieldTypes
    });

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ mb: 4 }}>
                <ClientFieldDefinitionManager
                    fieldDefinitions={fieldDefinitions}
                    fieldTypes={fieldTypes}
                    fileType={fileType}
                    fileDefinitionName={fileDefinitionName}
                    clientFileDefinitionId={clientFileDefinitionId}
                    createFieldDefinition={createFieldDefinition}
                    updateFieldDefinition={updateFieldDefinition}
                    deleteFieldDefinition={deleteFieldDefinition}
                />
            </Box>
        </Container>
    );
}

export default ClientFileFieldDefinitionList;