import type { ClientFileFieldDefinition } from "@/types/api";
import { Box, Container, Grid, Paper, Typography, Button, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFieldDefinition, updateFieldDefinition, deleteFieldDefinition } from "@/api/ClientFileDefinitions";
import { useState } from "react";
import { fetchFieldTypes } from "@/api/enum";

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
    const [editingField, setEditingField] = useState<ClientFileFieldDefinition | null>(null);
    const [newField, setNewField] = useState<Partial<ClientFileFieldDefinition> | null>(null);

    // Add query for field types
    const { data: fieldTypes = [] } = useQuery({
        queryKey: ["fieldTypes"],
        queryFn: fetchFieldTypes
    });

    const createMutation = useMutation({
        mutationFn: (fieldDefinition: Partial<ClientFileFieldDefinition>) =>
            createFieldDefinition(clientFileDefinitionId!, fieldDefinition),
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions"]);
            setNewField(null);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (fieldDefinition: ClientFileFieldDefinition) =>
            updateFieldDefinition(fieldDefinition.id!, fieldDefinition),
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions"]);
            setEditingField(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (fieldDefinitionId: string) =>
            deleteFieldDefinition(fieldDefinitionId),
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions"]);
        },
    });

    const handleEdit = (field: ClientFileFieldDefinition) => {
        setEditingField(field);
    };

    const handleSave = (field: ClientFileFieldDefinition) => {
        if (field.id) {
            updateMutation.mutate(field);
        } else {
            createMutation.mutate(field);
        }
    };

    const handleDelete = (fieldId: string) => {
        if (window.confirm('Are you sure you want to delete this field definition?')) {
            deleteMutation.mutate(fieldId);
        }
    };

    const handleAddNew = () => {
        setNewField({
            name: '',
            fieldType: '',
            key: '',
            path: '',
            compositeKeyOrder: 0,
            clientFileDefinitionId
        });
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ mb: 2 }}>
                <Button variant="contained" onClick={handleAddNew}>
                    Add New Field Definition
                </Button>
            </Box>
            <Box sx={{ border: 1, borderColor: "grey.300", mb: 4 }}>
                {newField && (
                    <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: 'grey.50' }}>
                        <Grid container spacing={2}>
                            <Grid item xs={3}>
                                <TextField
                                    fullWidth
                                    label="Name"
                                    value={newField.name}
                                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <TextField
                                    fullWidth
                                    label="Key"
                                    value={newField.key}
                                    onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={3}>
                                <FormControl fullWidth>
                                    <InputLabel>Field Type</InputLabel>
                                    <Select
                                        value={newField.fieldType}
                                        label="Field Type"
                                        onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                                    >
                                        {fieldTypes.map((type: string) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={3}>
                                <TextField
                                    fullWidth
                                    label="Path"
                                    value={newField.path}
                                    onChange={(e) => setNewField({ ...newField, path: e.target.value })}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    onClick={() => handleSave(newField as ClientFileFieldDefinition)}
                                    sx={{ mr: 1 }}
                                >
                                    Save
                                </Button>
                                <Button
                                    variant="outlined"
                                    onClick={() => setNewField(null)}
                                >
                                    Cancel
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                )}

                {fieldDefinitions && fieldDefinitions.length > 0 ? (
                    fieldDefinitions?.map((definition: ClientFileFieldDefinition, index: number) => (
                        <Paper
                            key={definition.id || index}
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: index % 2 === 0 ? "grey.100" : "white",
                                borderRadius: 0,
                            }}
                        >
                            {editingField?.id === definition.id ? (
                                <Grid container spacing={2}>
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            label="Name"
                                            value={editingField.name}
                                            onChange={(e) => setEditingField({
                                                ...editingField,
                                                name: e.target.value
                                            })}
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            label="Key"
                                            value={editingField.key}
                                            onChange={(e) => setEditingField({
                                                ...editingField,
                                                key: e.target.value
                                            })}
                                        />
                                    </Grid>
                                    <Grid item xs={3}>
                                        <FormControl fullWidth>
                                            <InputLabel>Field Type</InputLabel>
                                            <Select
                                                value={editingField.fieldType}
                                                label="Field Type"
                                                onChange={(e) => setEditingField({
                                                    ...editingField,
                                                    fieldType: e.target.value
                                                })}
                                            >
                                                {fieldTypes.map((type: string) => (
                                                    <MenuItem key={type} value={type}>
                                                        {type}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <TextField
                                            fullWidth
                                            label="Path"
                                            value={editingField.path}
                                            onChange={(e) => setEditingField({
                                                ...editingField,
                                                path: e.target.value
                                            })}
                                        />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleSave(editingField)}
                                            sx={{ mr: 1 }}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            onClick={() => setEditingField(null)}
                                        >
                                            Cancel
                                        </Button>
                                    </Grid>
                                </Grid>
                            ) : (
                                <Grid container spacing={2}>
                                    <Grid item xs={11}>
                                        <Typography variant="h6" component="h2">
                                            {definition.name}
                                        </Typography>
                                        <Typography variant="body2">
                                            Field Type: <b>{definition.fieldType}</b>
                                        </Typography>
                                        <Typography variant="body2">
                                            Key: <b>{definition.key}</b>
                                        </Typography>
                                        {fileType !== "FIXED_WIDTH_TOKENIZED" && (
                                            <Typography variant="body2">
                                                Path: <b>{definition.path}</b>
                                            </Typography>
                                        )}
                                        {fileType !== "YML" && (
                                            <>
                                                <Typography variant="body2">
                                                    Start Position: <b>{definition.startPosition}</b>
                                                </Typography>
                                                <Typography variant="body2">
                                                    End Position: <b>{definition.endPosition}</b>
                                                </Typography>
                                            </>
                                        )}
                                    </Grid>
                                    <Grid item xs={1}>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => handleEdit(definition)}
                                            sx={{ mr: 1 }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            color="error"
                                            size="small"
                                            onClick={() => handleDelete(definition.id!)}
                                        >
                                            Delete
                                        </Button>
                                    </Grid>
                                </Grid>
                            )}
                        </Paper>
                    ))
                ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="body1">
                            No Field definitions found for {fileDefinitionName}
                        </Typography>
                    </Box>
                )}
            </Box>
        </Container>
    );
}

export default ClientFileFieldDefinitionList;