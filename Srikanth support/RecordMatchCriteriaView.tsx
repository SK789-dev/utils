import { Box, Typography, Button } from "@mui/material";

interface RecordMatchCriteriaViewProps {
    rmcList: any[];
    loading: boolean;
    onViewRMC: () => void;
}

export function RecordMatchCriteriaView({ rmcList, loading, onViewRMC }: RecordMatchCriteriaViewProps) {
    return (
        <Box mt={2}>
            <Button
                size="small"
                onClick={onViewRMC}
                disabled={loading}
            >
                {loading ? "Loading..." : "View RMC"}
            </Button>
            <Box mt={2}>
                {rmcList?.length ? (
                    rmcList.map((rmc) => (
                        <Box key={rmc.id} sx={{ pl: 2, mt: 1 }}>
                            <Typography variant="body2">
                                <b>Name:</b> {rmc.name}
                            </Typography>
                            <Typography variant="body2">
                                <b>Base Field:</b> {rmc.baseRecordFieldPath}
                            </Typography>
                            <Typography variant="body2">
                                <b>Ruleset ID:</b> {rmc.rulesetId}
                            </Typography>
                            <Typography variant="body2">
                                <b>Client Field ID:</b> {rmc.clientFileDefinitionId}
                            </Typography>
                        </Box>
                    ))
                ) : (
                    <Typography variant="body2">
                        No RMC data available.
                    </Typography>
                )}
            </Box>
        </Box>
    );
}