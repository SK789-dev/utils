import { useState } from "react";
import { Box, Typography, Grid, TextField, Button, MenuItem, FormControl, InputLabel, Select, SelectChangeEvent } from "@mui/material";
import { FieldDefinition } from "@/types/api";

interface RecordMatchCriteriaFormProps {
    fieldDefinitions: FieldDefinition[];
    onSubmit: (data: { name: string; baseRecordFieldPath: string; rulesetId: string }) => Promise<void>;
}

export function RecordMatchCriteriaForm({ fieldDefinitions, onSubmit }: RecordMatchCriteriaFormProps) {
    const [recordMatch, setRecordMatch] = useState({
        name: "",
        baseRecordFieldPath: "",
        rulesetId: "",
    });

    const handleSubmit = async () => {
        try {
            await onSubmit(recordMatch);
            setRecordMatch({ name: "", baseRecordFieldPath: "", rulesetId: "" });
        } catch (error) {
            console.error("Failed to submit RMC:", error);
        }
    };

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
                Add Record Match Criteria
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="Match Criteria Name"
                        value={recordMatch.name}
                        onChange={(e) =>
                            setRecordMatch({
                                ...recordMatch,
                                name: e.target.value,
                            })
                        }
                    />
                </Grid>
                <Grid item xs={4}>
                    <FormControl fullWidth>
                        <InputLabel>Base Record Field Path</InputLabel>
                        <Select
                            value={recordMatch.baseRecordFieldPath}
                            label="Base Record Field Path"
                            onChange={(e: SelectChangeEvent) =>
                                setRecordMatch({
                                    ...recordMatch,
                                    baseRecordFieldPath: e.target.value,
                                })
                            }
                        >
                            {fieldDefinitions.map((field) => (
                                <MenuItem key={field.path} value={field.path}>
                                    {field.name} ({field.path})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={4}>
                    <TextField
                        fullWidth
                        label="Ruleset ID"
                        value={recordMatch.rulesetId}
                        onChange={(e) =>
                            setRecordMatch({
                                ...recordMatch,
                                rulesetId: e.target.value,
                            })
                        }
                    />
                </Grid>
                <Grid item xs={12}>
                    <Button variant="contained" onClick={handleSubmit}>
                        Save Record Match Criteria
                    </Button>
                </Grid>
            </Grid>
        </Box>
    );
}