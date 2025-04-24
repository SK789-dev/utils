import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
    CircularProgress,
    Container,
    Typography,
    Divider,
    Fab,
    TextField,
    Alert,
    Stack,
    Button,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import { Add, Edit, Save, Cancel, ExpandMore } from "@mui/icons-material";
import { useState, useEffect } from "react";
import {
    getClientFileDefinitions,
    postClientFileDefinitions,
} from "@/api/clients/clientFileDefinitions";

function ClientFileDefinitions() {
    const { clientId } = useParams();
    const queryClient = useQueryClient();

    const { data, isLoading, isError } = useQuery({
        queryKey: ["clientFileDefinitions", clientId],
        queryFn: () => getClientFileDefinitions(clientId as string),
        enabled: !!clientId,
    });

    const [fieldDefinitions, setFieldDefinitions] = useState<any[]>([]);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editedRow, setEditedRow] = useState<any>({});
    const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
    const [meta, setMeta] = useState<any>(null);

    useEffect(() => {
        if (data?.length) {
            const fdSet = data[0];
            setMeta(fdSet);
            setFieldDefinitions(fdSet.fieldDefinitions || []);
        } else if (clientId) {
            // Setup initial state for empty clients
            const emptyMeta = {
                name: "",
                id: "",
                clientId,
                lineOfBusiness: "",
                fileType: "",
                fileNameTokens: [],
            };
            setMeta(emptyMeta);
            setFieldDefinitions([]);
        }
    }, [data]);

    const handleEdit = (index: number) => {
        setEditIndex(index);
        setEditedRow({ ...fieldDefinitions[index] });
        setExpandedIndex(index);
    };

    const handleCancel = () => {
        setEditIndex(null);
        setEditedRow({});
    };

    const handleSave = async (index: number) => {
        const updated = [...fieldDefinitions];
        updated[index] = editedRow;
        setFieldDefinitions(updated);
        setEditIndex(null);
        setEditedRow({});

        const payload = {
            ...meta,
            fieldDefinitions: updated,
        };

        if (clientId) {
            await postClientFileDefinitions(clientId, payload);
            queryClient.invalidateQueries({ queryKey: ["clientFileDefinitions", clientId] });
        }
    };

    const handleAddRow = () => {
        const newRow = {
            id: Math.random().toString(36).substring(2),
            name: "",
            key: "",
            fieldType: "",
            startPosition: 0,
            endPosition: 0,
            compositeKeyOrder: 0,
            clientFileDefinitionId: meta?.id,
            path: "",
        };
        setFieldDefinitions((prev) => [...prev, newRow]);
        setEditIndex(fieldDefinitions.length);
        setEditedRow(newRow);
        setExpandedIndex(fieldDefinitions.length);
    };

    const handleChange = (key: string, value: string | number) => {
        setEditedRow((prev: any) => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return (
            <Container sx= {{ mt: 4 }
    }>
        <CircularProgress />
        </Container>
    );
}

if (isError || (!data?.length && !meta)) {
    return (
        <Container sx= {{ mt: 4 }
}>
    <Alert severity="error" > Unable to fetch or initialize file definitions.</Alert>
        </Container>
    );
  }

return (
    <Container sx= {{ mt: 4 }}>
        <Typography variant="h5" gutterBottom >
            File Definitions for the Client
                </Typography>
      { meta && (
        <Box sx= {{ mb: 2 }}>
            <Typography><strong>Client ID: </strong> {meta.clientId}</Typography >
                <Typography><strong>Name: </strong> {meta.name}</Typography >
                    <Typography><strong>Definition ID: </strong> {meta.id}</Typography >
                        <Typography><strong>Line of Business: </strong> {meta.lineOfBusiness}</Typography >
                            <Typography><strong>File Type: </strong> {meta.fileType}</Typography >
                                <Typography>
                                <strong>File Name Tokens: </strong> {meta.fileNameTokens?.length ? meta.fileNameTokens.join(", ") : "None"}
                                    </Typography>
                                    </Box>
      )}

<Divider sx={ { mb: 2 } } />

{
    fieldDefinitions.map((field, index) => (
        <Accordion
          key= { index }
          expanded = { expandedIndex === index}
onChange = {() => setExpandedIndex(expandedIndex === index ? null : index)}
        >
    <AccordionSummary expandIcon={ <ExpandMore /> }>
        <Typography variant="subtitle1" >
            { field.name || "Unnamed Field" } — <small>{ field.fieldType } </small>
                </Typography>
                </AccordionSummary>
                <AccordionDetails>
{
    editIndex === index ? (
        <Box display= "flex" flexDirection = "column" gap = { 1} >
            <TextField label="Name" size = "small" value = { editedRow.name } onChange = {(e) => handleChange("name", e.target.value)
} />
    < TextField label = "Key" size = "small" value = { editedRow.key } onChange = {(e) => handleChange("key", e.target.value)} />
        < TextField label = "Field Type" size = "small" value = { editedRow.fieldType } onChange = {(e) => handleChange("fieldType", e.target.value)} />
            < Stack direction = "row" spacing = { 2} >
                <TextField label="Start Position" size = "small" type = "number" value = { editedRow.startPosition } onChange = {(e) => handleChange("startPosition", Number(e.target.value))} />
                    < TextField label = "End Position" size = "small" type = "number" value = { editedRow.endPosition } onChange = {(e) => handleChange("endPosition", Number(e.target.value))} />
                        < TextField label = "Composite Key Order" size = "small" type = "number" value = { editedRow.compositeKeyOrder } onChange = {(e) => handleChange("compositeKeyOrder", Number(e.target.value))} />
                            </Stack>
                            < TextField label = "Client File Definition ID" size = "small" value = { editedRow.clientFileDefinitionId || meta.id } onChange = {(e) => handleChange("clientFileDefinitionId", e.target.value)} />
                                < TextField label = "Path" size = "small" value = { editedRow.path || "" } onChange = {(e) => handleChange("path", e.target.value)} />
                                    < Stack direction = "row" spacing = { 2} mt = { 1} >
                                        <Button variant="contained" startIcon = {< Save />} onClick = {() => handleSave(index)}> Save </Button>
                                            < Button variant = "outlined" startIcon = {< Cancel />} onClick = { handleCancel } > Cancel </Button>
                                                </Stack>
                                                </Box>
            ) : (
    <Box>
    <Typography><strong>ID: </strong> {field.id}</Typography >
        <Typography><strong>Name: </strong> {field.name}</Typography >
            <Typography><strong>Key: </strong> {field.key}</Typography >
                <Typography><strong>Field Type: </strong> {field.fieldType}</Typography >
                    <Typography><strong>Start - End: </strong> {field.startPosition} - {field.endPosition}</Typography >
                        <Typography><strong>Composite Key Order: </strong> {field.compositeKeyOrder}</Typography >
                            <Typography><strong>Client File Definition ID: </strong> {field.clientFileDefinitionId}</Typography >
                                <Typography><strong>Path: </strong> {field.path || "-"}</Typography >
                                    <Button variant="text" size = "small" startIcon = {< Edit />} onClick = {() => handleEdit(index)} sx = {{ mt: 1 }}> Edit </Button>
                                        </Box>
            )}
</AccordionDetails>
    </Accordion>
      ))}

<Fab color="primary" aria - label="add" onClick = { handleAddRow } sx = {{ position: "fixed", bottom: 32, right: 32 }}>
    <Add />
    </Fab>
    </Container>
  );
}

export default ClientFileDefinitions;