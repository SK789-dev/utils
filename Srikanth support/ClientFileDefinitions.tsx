import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Box,
    CircularProgress,
    Container,
    Typography,
    Paper,
    Grid,
    Alert,
    TextField,
    Button,
} from "@mui/material";
import { useState, useEffect } from "react";
import {
    getClientFileDefinitions,
    postClientFileDefinitions,
} from "@/api/clients/clientFileDefinitions";

function ClientFileDefinitions() {
    const { clientId } = useParams();
    const [clientName, setClientName] = useState("");
    const [fileDefinitions, setFileDefinitions] = useState([]);
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const { data, isLoading, isError } = useQuery({
        queryKey: ["clientFileDefinitions", clientId],
        queryFn: () => getClientFileDefinitions(clientId),
        enabled: !!clientId,
    });
    useEffect(() => {
        if (data) {
            setClientName(data.name);
            setFileDefinitions(data);
        }
    }, [data]);
    const [newDefinition, setNewDefinition] = useState({
        name: "",
        lineOfBusiness: "",
        fileType: "",
        fileNameTokens: [],
        fieldDefinitions: [],
    });
    const mutation = useMutation({
        mutationFn: () => {
            const payload = {
                name: newDefinition.name,
                lineOfBusiness: newDefinition.lineOfBusiness,
                fileType: newDefinition.fileType,
                ...(newDefinition.fileNameTokens.length > 0 && {
                    fileNameTokens: newDefinition.fileNameTokens,
                }),
                ...(newDefinition.fieldDefinitions.length > 0 && {
                    fieldDefinitions: newDefinition.fieldDefinitions,
                }),
            };
            return postClientFileDefinitions(clientId, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(["clientFileDefinitions", clientId]);
            setNewDefinition({
                name: "",
                lineOfBusiness: "",
                fileType: "",
                fileNameTokens: [],
                fieldDefinitions: [],
            });
            setShowAddForm(false);
        },
    });
    const handleSave = () => {
        if (
            newDefinition.name.trim() === "" ||
            newDefinition.lineOfBusiness.trim() === "" ||
            newDefinition.fileType.trim() === ""
        ) {
            alert("Name, Line of Business, and File Type are required.");
            return;
        }
        if (
            newDefinition.fileNameTokens.length === 0 &&
            newDefinition.fieldDefinitions.length === 0
        ) {
            const confirmSave = window.confirm(
                "No File Name Tokens or Field Definitions added. Do you still want to save?"
            );
            if (!confirmSave) return;
        }
        mutation.mutate();
    };
    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ mb: 3 }}>
                {/* <Typography variant="h5">
          {clientName || "Client"} - File Definitions
        </Typography> */}
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 3,
                    }}
                >
                    <Typography variant="h5">
                        {clientName || "Client"} - File Definitions
                    </Typography>
                    <Button
                        variant="outlined"
                        onClick={() => setShowAddForm((prev) => !prev)}
                    >
                        {showAddForm ? "Close" : "+ Add File Definition"}
                    </Button>
                </Box>
                {showAddForm && (
                    <Box sx={{ mt: 3, mb: 4, p: 2, border: "1px solid #ccc" }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>
                            Add New File Definition
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="File Name"
                                    value={newDefinition.name}
                                    onChange={(e) =>
                                        setNewDefinition({ ...newDefinition, name: e.target.value })
                                    }
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="Line of Business"
                                    value={newDefinition.lineOfBusiness}
                                    onChange={(e) =>
                                        setNewDefinition({
                                            ...newDefinition,
                                            lineOfBusiness: e.target.value,
                                        })
                                    }
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <TextField
                                    fullWidth
                                    label="File Type"
                                    value={newDefinition.fileType}
                                    onChange={(e) =>
                                        setNewDefinition({
                                            ...newDefinition,
                                            fileType: e.target.value,
                                        })
                                    }
                                />
                            </Grid>
                        </Grid>
                        <Button
                            sx={{ mt: 3, mb: 2 }}
                            variant="outlined"
                            onClick={() => {
                                setNewDefinition((prev) => ({
                                    ...prev,
                                    fileNameTokens: [
                                        ...(prev.fileNameTokens || []),
                                        { type: "", token: "", tokenOrder: 0 },
                                    ],
                                }));
                            }}
                        >
                            + Add File Name Token
                        </Button>
                        {newDefinition.fileNameTokens?.map((field, index) => (
                            <Grid container spacing={2} key={`token-${index}`} sx={{ mb: 2 }}>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="Token Type"
                                        value={field.type}
                                        onChange={(e) => {
                                            const updated = [...newDefinition.fileNameTokens];
                                            updated[index].type = e.target.value;
                                            setNewDefinition((prev) => ({
                                                ...prev,
                                                fileNameTokens: updated,
                                            }));
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="File Name Token"
                                        value={field.token}
                                        onChange={(e) => {
                                            const updated = [...newDefinition.fileNameTokens];
                                            updated[index].token = e.target.value;
                                            setNewDefinition({
                                                ...newDefinition,
                                                fileNameTokens: updated,
                                            });
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={2}>
                                    <TextField
                                        fullWidth
                                        label="File Name TokenOrder"
                                        type="number"
                                        value={field.tokenOrder}
                                        onChange={(e) => {
                                            const updated = [...newDefinition.fileNameTokens];
                                            updated[index].tokenOrder = parseInt(
                                                e.target.value || "0"
                                            );
                                            setNewDefinition({
                                                ...newDefinition,
                                                fileNameTokens: updated,
                                            });
                                        }}
                                    />
                                </Grid>
                            </Grid>
                        ))}
                        <Button
                            sx={{ mt: 3, mb: 2 }}
                            variant="outlined"
                            onClick={() => {
                                setNewDefinition((prev) => ({
                                    ...prev,
                                    fieldDefinitions: [
                                        ...(prev.fieldDefinitions || []),
                                        {
                                            name: "",
                                            key: "",
                                            fieldType: "",
                                            startPosition: 0,
                                            endPosition: 0,
                                            compositeKeyOrder: 0,
                                            path: "",
                                        },
                                    ],
                                }));
                            }}
                        >
                            + Add Field Definition
                        </Button>
                        {newDefinition.fieldDefinitions?.map((field, index) => (
              <Grid container spacing={2} key={`field-${index}`} sx={{ mb: 2 }}>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Field Name"
                    value={field.name}
                    onChange={(e) => {
                      const updated = [...newDefinition.fieldDefinitions];
                      updated[index].name = e.target.value;
                      setNewDefinition({
                        ...newDefinition,
                        fieldDefinitions: updated,
                      });
                    }}
                  />
                </Grid>
 <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Key"
                    value={field.key}
                    onChange={(e) => {
                      const updated = [...newDefinition.fieldDefinitions];
                      updated[index].key = e.target.value;
                      setNewDefinition({
                        ...newDefinition,
                        fieldDefinitions: updated,
                      });
                    }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Field Type"
                    value={field.fieldType}
                    onChange={(e) => {
                      const updated = [...newDefinition.fieldDefinitions];
                      updated[index].fieldType = e.target.value;
setNewDefinition({
                        ...newDefinition,
                        fieldDefinitions: updated,
                      });
                    }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Start Position"
                    type="number"
                    value={field.startPosition}
                    onChange={(e) => {
                      const updated = [...newDefinition.fieldDefinitions];
                      updated[index].startPosition = parseInt(
                        e.target.value || "0"
                      );
                      setNewDefinition({
                        ...newDefinition,
                        fieldDefinitions: updated,
                      });
                    }}
                  />
                </Grid>
<Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="End Position"
                    type="number"
                    value={field.endPosition}
                    onChange={(e) => {
                      const updated = [...newDefinition.fieldDefinitions];
                      updated[index].endPosition = parseInt(
                        e.target.value || "0"
                      );
                      setNewDefinition({
                        ...newDefinition,
                        fieldDefinitions: updated,
                      });
                    }}
                  />
                </Grid>
onChange={(e) => {
                      const updated = [...newDefinition.fieldDefinitions];
                      updated[index].path = e.target.value;
                      setNewDefinition({
                        ...newDefinition,
                        fieldDefinitions: updated,
                      });
                    }}
                  />
                </Grid>
                <Grid item xs={2}>
                  <TextField
                    fullWidth
                    label="Composite Key Order"
                    type="number"
                    value={field.compositeKeyOrder}
                    onChange={(e) => {
                      const updated = [...newDefinition.fieldDefinitions];
                      updated[index].compositeKeyOrder = parseInt(
                        e.target.value || "0"
                      );
setNewDefinition({
                        ...newDefinition,
                        fieldDefinitions: updated,
                      });
                    }}
                  />
                </Grid>
              </Grid>
                ))}
                <Button
                    variant="contained"
                    onClick={() => {
                        const payload = {
                            name: newDefinition.name,
                            lineOfBusiness: newDefinition.lineOfBusiness,
                            fileType: newDefinition.fileType,
                            ...(newDefinition.fileNameTokens.length > 0 && {
                                fileNameTokens: newDefinition.fileNameTokens,
                            }),
                            ...(newDefinition.fieldDefinitions.length > 0 && {
                                fieldDefinitions: newDefinition.fieldDefinitions,
                            }),
                        };
                        mutation.mutate(payload);
                    }}
                >
                    Save
                </Button>
            </Box>
        )}
            <Box>
                {fileDefinitions.length > 0 ? (
                    fileDefinitions.map((definition, index) => (
                        <Paper
                            key={definition.id || index}
                            elevation={0}
                            sx={{
                                p: 2,
                                backgroundColor: index % 2 === 0 ? "white.100" : "grey",
                                borderRadius: 0,
                            }}
                        >
                            <Grid container spacing={2}>
                                <Grid item xs={11}>
                                    <Typography variant="h6">
                                        {definition.name || "Name"}
                                    </Typography>
                                    <Typography variant="body2">
                                        LOB: {definition.lineOfBusiness || "Line of Business"}
                                    </Typography>
                                    <Typography variant="body2">
                                        File type: {definition.fileType || "File Type"}
                                    </Typography>
                                    <Typography variant="body2">
                                        {definition.fieldDefinitions?.length || 0} Field
                                        Definition(s)
                                    </Typography>
                                    <Typography variant="body2">
                                        {definition.fileNameTokens?.length || 0} File Name
                                        Token(s)
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    ))
                ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="body1">
                            No file definitions found for this client.
                        </Typography>
                    </Box>
                )}
            </Box>
        </Box>
    </Container >
  );
}
export default ClientFileDefinitions;