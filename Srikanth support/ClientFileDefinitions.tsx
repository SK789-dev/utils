import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    Box,
    CircularProgress,
    Container,
    Typography,
    Paper,
    Grid,
    IconButton,
    Alert,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import { useState, useEffect } from "react";
import { getClientFileDefinitions } from "@/api/clients/clientFileDefinitions";

function ClientFileDefinitions() {
    const { clientId } = useParams();
    const [clientName, setClientName] = useState(""); // This would be populated from client data

    const { data, isLoading, isError } = useQuery({
        queryKey: ["clientFileDefinitions", clientId],
        queryFn: () => getClientFileDefinitions(clientId),
        enabled: !!clientId,
    });

    const [fileDefinitions, setFileDefinitions] = useState([]);

    useEffect(() => {
        if (data) {
            setFileDefinitions(data);
        }
    }, [data]);

    if (isLoading) {
        return (
            <Container sx={{ mt: 4 }
            }>
                <CircularProgress />
            </Container>
        );
    }

    if (isError) {
        return (
            <Container sx={{ mt: 4 }
            }>
                <Alert severity="error" > Unable to fetch file definitions.</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography variant="h5" component="h1" >
                        {clientName || "Client Name"} - File Definitions
                    </Typography>

                </Box>

            </Box>

            < Box sx={{ border: 1, borderColor: "grey.300", mb: 4 }}>
                {
                    fileDefinitions.length > 0 ? (
                        fileDefinitions.map((definition, index) => (
                            <Paper
                                key={definition.id || index}
                                elevation={0}
                                sx={{
                                    p: 2,
                                    backgroundColor: index % 2 === 0 ? "grey.100" : "white",
                                    borderRadius: 0,
                                }}
                            >
                                <Grid container spacing={2} >
                                    <Grid item xs={11} >
                                        <Typography variant="h6" component="h2" >
                                            {definition.name || "Name"}
                                        </Typography>
                                        < Typography variant="body2" >
                                            LOB: {definition.lineOfBusiness || "Line of Business"}
                                        </Typography>
                                        < Typography variant="body2" >
                                            File type: {definition.fileType || "File Type"}
                                        </Typography>
                                        < Typography variant="body2" >
                                            {
                                                definition.fieldDefinitions
                                                    ? `${definition.fieldDefinitions.length} Field Definition(s)`
                                                    : "0 Field Definition(s)"
                                            }
                                        </Typography>
                                    </Grid>

                                </Grid>
                            </Paper>
                        ))
                    ) : (
                        <Box sx={{ p: 4, textAlign: "center" }}>
                            <Typography variant="body1" > No file definitions found for this client.</Typography>
                        </Box>
                    )}
            </Box>
        </Container >
    );
}

export default ClientFileDefinitions;