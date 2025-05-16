import { useState } from "react";
import {
    Grid,
    Paper,
    Typography,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Container
} from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * A reusable component for handling field definitions
 * Can be used in both ClientFileDefinitionList and ClientFileFieldDefinitionList
 */
function FieldDefinitionEditor({
    fieldDefinition,
    fieldTypes,
    fileType,
    onSave,
    onCancel,
    isNew = false
}) {
    const [field, setField] = useState(fieldDefinition);

    const handleFieldChange = (key, value) => {
        setField({ ...field, [key]: value });
    };

    return (
        <Paper elevation={0} sx={{ p: 2, mb: 2, backgroundColor: isNew ? 'grey.50' : 'inherit' }}>
            <Grid container spacing={2}>
                <Grid item xs={3}>
                    <TextField
                        fullWidth
                        label="Name"
                        value={field.name || ""}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                    />
                </Grid>
                <Grid item xs={3}>
                    <TextField
                        fullWidth
                        label="Key"
                        value={field.key || ""}
                        onChange={(e) => handleFieldChange("key", e.target.value)}
                    />
                </Grid>
                <Grid item xs={3}>
                    <FormControl fullWidth>
                        <InputLabel>Field Type</InputLabel>
                        <Select
                            value={field.fieldType || ""}
                            label="Field Type"
                            onChange={(e) => handleFieldChange("fieldType", e.target.value)}
                        >
                            {fieldTypes.map((type) => (
                                <MenuItem key={type} value={type}>
                                    {type}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                {fileType !== "FIXED_WIDTH_TOKENIZED" && (
                    <Grid item xs={3}>
                        <TextField
                            fullWidth
                            label="Path"
                            value={field.path || ""}
                            onChange={(e) => handleFieldChange("path", e.target.value)}
                        />
                    </Grid>
                )}
                {fileType !== "YML" && (
                    <>
                        <Grid item xs={fileType === "FIXED_WIDTH_TOKENIZED" ? 3 : 2}>
                            <TextField
                                fullWidth
                                label="Start Position"
                                type="number"
                                value={field.startPosition || 0}
                                onChange={(e) => handleFieldChange("startPosition", parseInt(e.target.value || "0"))}
                            />
                        </Grid>
                        <Grid item xs={fileType === "FIXED_WIDTH_TOKENIZED" ? 3 : 2}>
                            <TextField
                                fullWidth
                                label="End Position"
                                type="number"
                                value={field.endPosition || 0}
                                onChange={(e) => handleFieldChange("endPosition", parseInt(e.target.value || "0"))}
                            />
                        </Grid>
                    </>
                )}
                <Grid item xs={12}>
                    <Button
                        variant="contained"
                        onClick={() => onSave(field)}
                        sx={{ mr: 1 }}
                    >
                        Save
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
}

/**
 * A reusable component for displaying field definition details
 */
function FieldDefinitionDisplay({
    definition,
    fileType,
    onEdit,
    onDelete
}) {
    return (
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
                {definition.compositeKeyOrder !== undefined && (
                    <Typography variant="body2">
                        Composite Key Order: <b>{definition.compositeKeyOrder + 1}</b>
                    </Typography>
                )}
            </Grid>
            <Grid item xs={1}>
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => onEdit(definition)}
                    sx={{ mr: 1, mb: 1 }}
                >
                    Edit
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={() => onDelete(definition.id)}
                >
                    Delete
                </Button>
            </Grid>
        </Grid>
    );
}

/**
 * Reusable manager component for field definitions
 */
function ClientFieldDefinitionManager({
    fieldDefinitions = [],
    fieldTypes = [],
    fileType = "",
    fileDefinitionName = "",
    clientFileDefinitionId,
    createFieldDefinition,
    updateFieldDefinition,
    deleteFieldDefinition
}) {
    const queryClient = useQueryClient();
    const [editingField, setEditingField] = useState(null);
    const [newField, setNewField] = useState(null);

    const createMutation = useMutation({
        mutationFn: (fieldDefinition) =>
            createFieldDefinition(clientFileDefinitionId, fieldDefinition),
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions"]);
            setNewField(null);
        },
    });

    const updateMutation = useMutation({
        mutationFn: (fieldDefinition) =>
            updateFieldDefinition(fieldDefinition.id, fieldDefinition),
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions"]);
            setEditingField(null);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (fieldDefinitionId) =>
            deleteFieldDefinition(fieldDefinitionId),
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions"]);
        },
    });

    const handleEdit = (field) => {
        setEditingField(field);
    };

    const handleSave = (field) => {
        if (field.id) {
            updateMutation.mutate(field);
        } else {
            createMutation.mutate(field);
        }
    };

    const handleDelete = (fieldId) => {
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
            compositeKeyOrder: fieldDefinitions.length,
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
                    <FieldDefinitionEditor
                        fieldDefinition={newField}
                        fieldTypes={fieldTypes}
                        fileType={fileType}
                        onSave={handleSave}
                        onCancel={() => setNewField(null)}
                        isNew={true}
                    />
                )}

                {fieldDefinitions && fieldDefinitions.length > 0 ? (
                    fieldDefinitions.map((definition, index) => (
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
                                <FieldDefinitionEditor
                                    fieldDefinition={editingField}
                                    fieldTypes={fieldTypes}
                                    fileType={fileType}
                                    onSave={handleSave}
                                    onCancel={() => setEditingField(null)}
                                />
                            ) : (
                                <FieldDefinitionDisplay
                                    definition={definition}
                                    fileType={fileType}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
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

export { ClientFieldDefinitionManager, FieldDefinitionEditor, FieldDefinitionDisplay };