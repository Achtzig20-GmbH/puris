/*
Copyright (c) 2024 Volkswagen AG
Copyright (c) 2024 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This program and the accompanying materials are made available under the
terms of the Apache License, Version 2.0 which is available at
https://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
License for the specific language governing permissions and limitations
under the License.

SPDX-License-Identifier: Apache-2.0
*/
import { useEffect, useMemo, useState } from 'react';
import { Input, PageSnackbar, PageSnackbarStack, Table } from '@catena-x/portal-shared-components';
import { UNITS_OF_MEASUREMENT } from '@models/constants/uom';
import { Production } from '@models/types/data/production';
import { Autocomplete, Box, Button, Dialog, DialogTitle, Grid, Stack, Typography, capitalize } from '@mui/material';
import { getUnitOfMeasurement, isValidOrderReference } from '@util/helpers';
import { usePartners } from '@features/stock-view/hooks/usePartners';
import { deleteProduction, postProductionRange } from '@services/productions-service';
import { Notification } from '@models/types/data/notification';
import { Close, Delete, Save } from '@mui/icons-material';
import { DateTime } from '@components/ui/DateTime';

const GridItem = ({ label, value }: { label: string; value: string }) => (
    <Grid item xs={6}>
        <Stack>
            <Typography variant="caption1" fontWeight={500}>
                {label}:
            </Typography>
            <Typography variant="body3" paddingLeft=".5rem">
                {value}
            </Typography>
        </Stack>
    </Grid>
);

const createProductionColumns = (handleDelete: (row: Production) => void) =>
    [
        {
            field: 'estimatedTimeOfCompletion',
            headerName: 'Completion Time',
            headerAlign: 'center',
            width: 150,
            renderCell: (data: { row: Production }) => (
                <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                    {new Date(data.row.estimatedTimeOfCompletion).toLocaleTimeString('de-DE')}
                </Box>
            ),
        },
        {
            field: 'quantity',
            headerName: 'Quantity',
            headerAlign: 'center',
            width: 120,
            renderCell: (data: { row: Production }) => (
                <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                    {`${data.row.quantity} ${getUnitOfMeasurement(data.row.measurementUnit)}`}
                </Box>
            ),
        },
        {
            field: 'partner',
            headerName: 'Partner',
            headerAlign: 'center',
            width: 200,
            renderCell: (data: { row: Production }) => (
                <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                    {data.row.partner?.name}
                </Box>
            ),
        },
        {
            field: 'customerOrderNumber',
            headerName: 'Order Reference',
            headerAlign: 'center',
            width: 200,
            renderCell: (data: { row: Production }) => (
                <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                    {data.row.customerOrderNumber || data.row.supplierOrderNumber ? (
                        <Stack>
                            <Box>{`${data.row.customerOrderNumber || '-' } / ${data.row.customerOrderPositionNumber || '-'}  `}</Box>
                            <Box>{data.row.supplierOrderNumber || '-'}</Box>
                        </Stack>
                    ) : (
                        '-'
                    )}
                </Box>
            ),
        },
        {
            field: 'delete',
            headerName: '',
            sortable: false,
            filterable: false,
            hideable: false,
            headerAlign: 'center',
            width: 30,
            renderCell: (data: { row: Production }) => (
                <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                    <Button variant="text" color="error" onClick={() => handleDelete(data.row)}>
                        <Delete></Delete>
                    </Button>
                </Box>
            ),
        },
    ] as const;

type PlannedProductionModalProps = {
    open: boolean;
    mode: 'create' | 'edit';
    onClose: () => void;
    onSave: () => void;
    production: Partial<Production> | null;
    productions: Production[];
};
const isValidProduction = (production: Partial<Production>) =>
    production &&
    production.estimatedTimeOfCompletion &&
    production.quantity &&
    production.measurementUnit &&
    production.partner &&
    isValidOrderReference(production);

export const PlannedProductionModal = ({ open, mode, onClose, onSave, production, productions }: PlannedProductionModalProps) => {
    const [temporaryProduction, setTemporaryProduction] = useState<Partial<Production>>(production ?? {});
    const { partners } = usePartners('product', temporaryProduction?.material?.materialNumberSupplier ?? null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [formError, setFormError] = useState(false);
    const dailyProductions = useMemo(
        () =>
            productions.filter(
                (p) =>
                    new Date(p.estimatedTimeOfCompletion).toLocaleDateString() ===
                    new Date(production?.estimatedTimeOfCompletion ?? Date.now()).toLocaleDateString()
            ),
        [productions, production?.estimatedTimeOfCompletion]
    );

    const handleSaveClick = () => {
        temporaryProduction.customerOrderNumber ||= undefined;
        temporaryProduction.customerOrderPositionNumber ||= undefined;
        temporaryProduction.supplierOrderNumber ||= undefined;
        if (!isValidProduction(temporaryProduction)) {
            setFormError(true);
            return;
        }
        setFormError(false);
        postProductionRange([temporaryProduction])
            .then(() => {
                onSave();
                setNotifications((ns) => [
                    ...ns,
                    {
                        title: 'Production Created',
                        description: 'The Production has been saved successfully',
                        severity: 'success',
                    },
                ]);
            })
            .catch((error) => {
                setNotifications((ns) => [
                    ...ns,
                    {
                        title: error.status === 409 ? 'Conflict' : 'Error requesting update',
                        description: error.status === 409 ? 'Date conflicting with another Production' : error.error,
                        severity: 'error',
                    },
                ]);
            })
            .finally(onClose);
    };
    const handleDelete = (row: Production) => {
        if (row.uuid) deleteProduction(row.uuid).then(onSave);
    };
    useEffect(() => {
        if (production) setTemporaryProduction(production);
    }, [production]);
    return (
        <>
            <Dialog open={open && production !== null} onClose={onClose}>
                <DialogTitle fontWeight={600} textAlign="center">
                    {capitalize(mode)} Production Information
                </DialogTitle>
                <Stack padding="0 2rem 2rem" sx={{ width: '50rem' }}>
                    <Grid container spacing={2} padding=".25rem">
                        {mode === 'create' ? (
                            <>
                                <GridItem label="Material Number" value={temporaryProduction.material?.materialNumberSupplier ?? ''} />
                                <GridItem label="Site" value={temporaryProduction.productionSiteBpns ?? ''} />
                                <Grid item xs={6} display="flex" alignItems="end">
                                    <DateTime
                                        label="Estimated Completion Time"
                                        placeholder="Pick Production Date"
                                        locale="de"
                                        error={formError}
                                        value={temporaryProduction.estimatedTimeOfCompletion ?? null}
                                        onValueChange={(date) =>
                                            setTemporaryProduction({ ...temporaryProduction, estimatedTimeOfCompletion: date ?? undefined })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Autocomplete
                                        sx={{ margin: '0' }}
                                        id="partner"
                                        options={partners ?? []}
                                        getOptionLabel={(option) => option?.name ?? ''}
                                        renderInput={(params) => (
                                            <Input
                                                {...params}
                                                label="Partner*"
                                                placeholder="Select a Partner"
                                                error={formError && !temporaryProduction?.partner}
                                            />
                                        )}
                                        onChange={(_, value) =>
                                            setTemporaryProduction({ ...temporaryProduction, partner: value ?? undefined })
                                        }
                                        value={temporaryProduction.partner ?? null}
                                        isOptionEqualToValue={(option, value) => option?.uuid === value?.uuid}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        id="quantity"
                                        label="Quantity*"
                                        type="number"
                                        placeholder="Enter quantity"
                                        value={temporaryProduction.quantity ?? ''}
                                        error={formError && !temporaryProduction?.quantity}
                                        onChange={(e) =>
                                            setTemporaryProduction((curr) => ({
                                                ...curr,
                                                quantity: e.target.value ? parseFloat(e.target.value) : undefined,
                                            }))
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Autocomplete
                                        id="uom"
                                        value={
                                            temporaryProduction.measurementUnit
                                                ? {
                                                      key: temporaryProduction.measurementUnit,
                                                      value: getUnitOfMeasurement(temporaryProduction.measurementUnit),
                                                  }
                                                : null
                                        }
                                        options={UNITS_OF_MEASUREMENT}
                                        getOptionLabel={(option) => option?.value ?? ''}
                                        renderInput={(params) => (
                                            <Input
                                                {...params}
                                                label="UOM*"
                                                placeholder="Select unit"
                                                error={formError && !temporaryProduction?.measurementUnit}
                                            />
                                        )}
                                        onChange={(_, value) =>
                                            setTemporaryProduction((curr) => ({ ...curr, measurementUnit: value?.key }))
                                        }
                                        isOptionEqualToValue={(option, value) => option?.key === value?.key}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        id="customer-order-number"
                                        label="Customer Order Number"
                                        type="text"
                                        error={formError && !isValidOrderReference(temporaryProduction)}
                                        value={temporaryProduction?.customerOrderNumber ?? ''}
                                        onChange={(event) =>
                                            setTemporaryProduction({ ...temporaryProduction, customerOrderNumber: event.target.value })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        id="customer-order-position-number"
                                        label="Customer Order Position"
                                        type="text"
                                        error={formError && !isValidOrderReference(temporaryProduction)}
                                        value={temporaryProduction?.customerOrderPositionNumber ?? ''}
                                        onChange={(event) =>
                                            setTemporaryProduction({
                                                ...temporaryProduction,
                                                customerOrderPositionNumber: event.target.value,
                                            })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        id="supplier-order-number"
                                        label="Supplier Order Number"
                                        type="text"
                                        value={temporaryProduction?.supplierOrderNumber ?? ''}
                                        onChange={(event) =>
                                            setTemporaryProduction({
                                                ...temporaryProduction,
                                                supplierOrderNumber: event.target.value ?? '',
                                            })
                                        }
                                    />
                                </Grid>
                            </>
                        ) : (
                            <Grid item xs={12}>
                                <Table
                                    title={`Planned Production ${
                                        temporaryProduction?.estimatedTimeOfCompletion
                                            ? ' on ' +
                                              new Date(temporaryProduction?.estimatedTimeOfCompletion).toLocaleDateString(undefined, {
                                                  weekday: 'long',
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                              })
                                            : ''
                                    }`}
                                    getRowId={(row) => row.uuid}
                                    columns={createProductionColumns(handleDelete)}
                                    rows={dailyProductions}
                                    hideFooter
                                    density="standard"
                                />
                            </Grid>
                        )}
                    </Grid>
                    <Box display="flex" gap="1rem" width="100%" justifyContent="end" marginTop="2rem">
                        <Button variant="outlined" color="primary" sx={{ display: 'flex', gap: '.25rem' }} onClick={onClose}>
                            <Close></Close> Close
                        </Button>
                        {mode === 'create' && (
                            <Button variant="contained" color="primary" sx={{ display: 'flex', gap: '.25rem' }} onClick={handleSaveClick}>
                                <Save></Save> Save
                            </Button>
                        )}
                    </Box>
                </Stack>
            </Dialog>
            <PageSnackbarStack>
                {notifications.map((notification, index) => (
                    <PageSnackbar
                        key={index}
                        open={!!notification}
                        severity={notification?.severity}
                        title={notification?.title}
                        description={notification?.description}
                        autoClose={true}
                        onCloseNotification={() => setNotifications((ns) => ns.filter((_, i) => i !== index) ?? [])}
                    />
                ))}
            </PageSnackbarStack>
        </>
    );
};
