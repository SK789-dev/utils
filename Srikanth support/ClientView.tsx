import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  CircularProgress,
  Container,
  IconButton,
  Snackbar,
  Alert,
  Typography,
  Dialog,
} from "@mui/material";
import { Edit } from "@mui/icons-material";
import { getClient, updateClient } from "@/api/clients";
import ManageClientModal from "@/components/pop-up/ManageClient";

function ClientView() {
  const { clientId } = useParams();
  const queryClient = useQueryClient();

  const {
    data: client,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => getClient(clientId as string),
    enabled: !!clientId,
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [clientState, setClientState] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  useEffect(() => {
    if (client) {
      setClientState(client);
    }
  }, [client]);

  const updateClientMutation = useMutation({
    mutationFn: ([id, payload]: [string, any]) => updateClient(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["client", clientId], data);
      setClientState(data);
      setSnackbar({
        open: true,
        message: "Client updated successfully!",
        severity: "success",
      });
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: "Failed to update client. Please try again.",
        severity: "error",
      });
    },
  });

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleClientUpdate = (updatedValues: any) => {
    if (!clientId) return;
    updateClientMutation.mutate([clientId, updatedValues]);
    setDialogOpen(false);
  };

  return (
    <Container sx={{ mt: 4 }}>
      {isLoading ? (
        <CircularProgress />
      ) : isError ? (
        <Snackbar open autoHideDuration={6000}>
          <Alert severity="error">Failed to fetch client details!</Alert>
        </Snackbar>
      ) : clientState ? (
        <>
          <div className="flex items-center gap-2 mb-4">
            <Typography variant="h4" gutterBottom>
              {clientState.name} ({clientState.code})
            </Typography>
            <IconButton onClick={handleOpenDialog} color="primary">
              <Edit />
            </IconButton>
          </div>

          <Typography variant="h5" gutterBottom sx={{ textDecoration: "underline" }}>
            CarrierIds by LOB
          </Typography>

          <div className="flex flex-col w-full gap-2 pt-2">
            {Object.entries(
              clientState.linesOfBusiness.reduce<Record<string, string[]>>(
                (carrierIdsByLOB, clientLOB) => {
                  const { lineOfBusiness: lob, carrierId } = clientLOB;
                  if (!carrierIdsByLOB[lob]) {
                    carrierIdsByLOB[lob] = [];
                  }
                  carrierIdsByLOB[lob].push(carrierId);
                  return carrierIdsByLOB;
                },
                {}
              )
            ).map(([lob, carrierIds]) => (
              <div key={`lob-${lob}`} className="flex flex-row items-center">
                <Typography variant="body1">
                  <strong>{lob}:</strong>&nbsp;
                  {carrierIds.join(", ")}
                </Typography>
              </div>
            ))}
          </div>

          <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="md">
            <ManageClientModal
              onClose={handleCloseDialog}
              onClientCreated={handleClientUpdate}
              title="Edit Client"
              submitButtonLabel="Save Changes"
              initialValues={clientState}
            />
          </Dialog>
        </>
      ) : null}

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default ClientView;