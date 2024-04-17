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
import { Input, PageSnackbar, PageSnackbarStack, Table } from '@catena-x/portal-shared-components';
import { DateTime } from '@components/ui/DateTime';
import { usePartners } from '@features/stock-view/hooks/usePartners';
import { UNITS_OF_MEASUREMENT } from '@models/constants/uom';
import { Delivery } from '@models/types/data/delivery';
import { Close, Delete, Save } from '@mui/icons-material';
import { Autocomplete, Box, Button, Dialog, DialogTitle, Grid, Stack, Typography, capitalize } from '@mui/material';
import { deleteDelivery, postDelivery } from '@services/delivery-service';
import { getIncoterm, getUnitOfMeasurement, isValidOrderReference } from '@util/helpers';
import { useEffect, useMemo, useState } from 'react';
import { Notification } from '@models/types/data/notification';
import { INCOTERMS } from '@models/constants/incoterms';

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

const createDeliveryColumns = (handleDelete: (row: Delivery) => void) =>
    [
        {
            field: 'dateOfDeparture',
            headerName: 'Departure Time',
            headerAlign: 'center',
            width: 120,
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                        {new Date(data.row.dateOfDeparture!).toLocaleTimeString('de-DE')}
                    </Box>
                );
            },
        },
        {
            field: 'dateofArrival',
            headerName: 'Arrival Time',
            headerAlign: 'center',
            width: 150,
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                        {new Date(data.row.dateOfArrival!).toLocaleString('de-DE')}
                    </Box>
                );
            },
        },
        {
            field: 'quantity',
            headerName: 'Quantity',
            headerAlign: 'center',
            width: 120,
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                        {`${data.row.quantity} ${getUnitOfMeasurement(data.row.measurementUnit)}`}
                    </Box>
                );
            },
        },
        {
            field: 'partnerBpnl',
            headerName: 'Partner',
            headerAlign: 'center',
            width: 200,
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                        {data.row.partnerBpnl}
                    </Box>
                );
            },
        },
        {
            field: 'customerOrderNumber',
            headerName: 'Order Reference',
            sortable: false,
            headerAlign: 'center',
            width: 200,
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box
                        display="flex"
                        flexDirection="column"
                        textAlign="center"
                        alignItems="center"
                        justifyContent="center"
                        width="100%"
                        height="100%"
                    >
                        {data.row.customerOrderNumber ? (
                            <>
                                <Box>{`${data.row.customerOrderNumber} / ${data.row.customerOrderPositionNumber}`}</Box>
                                <Box>{data.row.supplierOrderNumber}</Box>
                            </>
                        ) : (
                            '-'
                        )}
                    </Box>
                );
            },
        },
        {
            field: 'trackingNumber',
            headerName: 'Tracking Number',
            headerAlign: 'center',
            width: 130,
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                        {data.row.trackingNumber}
                    </Box>
                );
            },
        },
        {
            field: 'incoterm',
            headerName: 'Incoterm',
            headerAlign: 'center',
            width: 150,
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box display="flex" flexDirection="column" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                        <Box>{INCOTERMS.find((i) => i.key === data.row.incoterm)?.value ?? '-'}</Box>
                        <Box>({data.row.incoterm})</Box>
                    </Box>
                );
            },
        },
        {
            field: 'delete',
            headerName: '',
            sortable: false,
            hideable: false,
            filterable: false,
            headerAlign: 'center',
            renderCell: (data: { row: Delivery }) => {
                return (
                    <Box display="flex" textAlign="center" alignItems="center" justifyContent="center" width="100%" height="100%">
                        <Button variant="text" color="error" onClick={() => handleDelete(data.row)}>
                            <Delete></Delete>
                        </Button>
                    </Box>
                );
            },
        },
    ] as const;

const isValidDelivery = (delivery: Partial<Delivery>) => 
        delivery.ownMaterialNumber &&
        delivery.originBpns &&
        delivery.partnerBpnl &&
        delivery.destinationBpns &&
        delivery.quantity &&
        delivery.measurementUnit &&
        delivery.dateOfDeparture &&
        delivery.dateOfArrival &&
        isValidOrderReference(delivery);

type DeliveryInformationModalProps = {
    open: boolean;
    mode: 'create' | 'edit';
    onClose: () => void;
    onSave: () => void;
    delivery: Delivery | null;
    deliveries: Delivery[];
};

export const DeliveryInformationModal = ({ open, mode, onClose, onSave, delivery, deliveries }: DeliveryInformationModalProps) => {
    const [temporaryDelivery, setTemporaryDelivery] = useState<Partial<Delivery>>(delivery ?? {});
    const { partners } = usePartners('product', temporaryDelivery?.ownMaterialNumber ?? null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [formError, setFormError] = useState(false);
    const dailyDeliveries = useMemo(
        () =>
            deliveries?.filter(
                (d) =>
                    d.dateOfDeparture &&
                    new Date(d.dateOfDeparture).toLocaleDateString() ===
                        new Date(delivery?.dateOfDeparture ?? Date.now()).toLocaleDateString()
            ) ?? [],
        [deliveries, delivery?.dateOfDeparture]
    );

    const handleSaveClick = () => {
        temporaryDelivery.customerOrderNumber ||= undefined;
        temporaryDelivery.customerOrderPositionNumber ||= undefined;
        temporaryDelivery.supplierOrderNumber ||= undefined; 
        if (!isValidDelivery(temporaryDelivery)) {
            setFormError(true);
            return;
        }
        setFormError(false);

        postDelivery(temporaryDelivery)
            .then(() => {
                onSave();
                setNotifications((ns) => [
                    ...ns,
                    {
                        title: 'Delivery Added',
                        description: 'The Delivery has been saved added',
                        severity: 'success',
                    },
                ]);
            })
            .catch((error) => {
                setNotifications((ns) => [
                    ...ns,
                    {
                        title: error.status === 409 ? 'Conflict' : 'Error requesting update',
                        description: error.status === 409 ? 'Delivery conflicting with an existing one' : error.error,
                        severity: 'error',
                    },
                ]);
            })
            .finally(() => onClose());
    };

    const handleDelete = (row: Delivery) => {
        if (row.uuid) deleteDelivery(row.uuid).then(onSave);
    };

    useEffect(() => {
        if (delivery) {
            setTemporaryDelivery(delivery);
        }
    }, [delivery]);
    return (
        <>
            <Dialog open={open && delivery !== null} onClose={onClose}>
                <DialogTitle fontWeight={600} textAlign="center">
                    {capitalize(mode)} Delivery Information
                </DialogTitle>
                <Stack padding="0 2rem 2rem" sx={{ width: '80rem' }}>
                    <Grid container spacing={1} padding=".25rem">
                        {mode === 'create' ? (
                            <>
                                <GridItem label="Material Number" value={temporaryDelivery.ownMaterialNumber ?? ''} />
                                <GridItem label="Origin Site" value={temporaryDelivery.originBpns ?? ''} />
                                <Grid item xs={6} display="flex" alignItems="end">
                                    <DateTime
                                        label="Departure Time"
                                        placeholder="Pick Departure Date"
                                        locale="de"
                                        error={formError}
                                        value={temporaryDelivery?.dateOfDeparture ?? null}
                                        onValueChange={(date) => setTemporaryDelivery({ ...temporaryDelivery, dateOfDeparture: date ?? undefined })}
                                    />
                                </Grid>
                                <Grid item xs={6} display="flex" alignItems="end">
                                    <DateTime
                                        label="Arrival Time"
                                        placeholder="Pick Arrival Date"
                                        locale="de"
                                        error={formError}
                                        value={temporaryDelivery?.dateOfArrival ?? null}
                                        onValueChange={(date) => setTemporaryDelivery({ ...temporaryDelivery, dateOfArrival: date ?? undefined})}
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
                                                error={formError && !temporaryDelivery?.partnerBpnl}
                                            />
                                        )}
                                        onChange={(_, value) =>
                                            setTemporaryDelivery({ ...temporaryDelivery, partnerBpnl: value?.bpnl ?? undefined })
                                        }
                                        value={partners?.find((p) => p.bpnl === temporaryDelivery.partnerBpnl) ?? null}
                                        isOptionEqualToValue={(option, value) => option?.bpnl === value?.bpnl}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Autocomplete
                                        id="destinationBpns"
                                        options={partners?.find((s) => s.bpnl === temporaryDelivery?.partnerBpnl)?.sites ?? []}
                                        getOptionLabel={(option) => option.name ?? ''}
                                        disabled={!temporaryDelivery?.partnerBpnl}
                                        isOptionEqualToValue={(option, value) => option?.bpns === value.bpns}
                                        onChange={(_, value) =>
                                            setTemporaryDelivery({ ...temporaryDelivery, destinationBpns: value?.bpns ?? undefined })
                                        }
                                        value={partners
                                            ?.find((s) => s.bpnl === temporaryDelivery?.partnerBpnl)
                                            ?.sites.find((s) => s.bpns === temporaryDelivery?.destinationBpns) ?? null}
                                        renderInput={(params) => (
                                            <Input
                                                {...params}
                                                label="Destination*"
                                                placeholder="Select a Destination Site"
                                                error={formError && !temporaryDelivery?.destinationBpns}
                                            />
                                        )}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        label="Quantity*"
                                        type="number"
                                        value={temporaryDelivery.quantity ?? ''}
                                        error={formError && !temporaryDelivery?.quantity}
                                        onChange={(e) =>
                                            setTemporaryDelivery((curr) => ({ ...curr, quantity: e.target.value ? parseFloat(e.target.value) : undefined}))
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Autocomplete
                                        id="uom"
                                        value={
                                            temporaryDelivery.measurementUnit
                                                ? {
                                                      key: temporaryDelivery.measurementUnit,
                                                      value: getUnitOfMeasurement(temporaryDelivery.measurementUnit),
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
                                                error={formError && !temporaryDelivery?.measurementUnit}
                                            />
                                        )}
                                        onChange={(_, value) => setTemporaryDelivery((curr) => ({ ...curr, measurementUnit: value?.key }))}
                                        isOptionEqualToValue={(option, value) => option?.key === value?.key}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        id="tracking-number"
                                        label="Tracking Number*"
                                        type="text"
                                        value={temporaryDelivery?.trackingNumber ?? ''}
                                        onChange={(event) =>
                                            setTemporaryDelivery({ ...temporaryDelivery, trackingNumber: event.target.value })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                <Autocomplete
                                        id="incoterm"
                                        value={
                                            temporaryDelivery.incoterm
                                                ? {
                                                      key: temporaryDelivery.incoterm,
                                                      value: getIncoterm(temporaryDelivery.incoterm),
                                                  }
                                                : null
                                        }
                                        options={INCOTERMS}
                                        getOptionLabel={(option) => option?.value ?? ''}
                                        renderInput={(params) => (
                                            <Input
                                                {...params}
                                                label="Incoterm*"
                                                placeholder="Select Incoterm"
                                                error={formError && !temporaryDelivery?.measurementUnit}
                                            />
                                        )}
                                        onChange={(_, value) => setTemporaryDelivery((curr) => ({ ...curr, incoterm: value?.key }))}
                                        isOptionEqualToValue={(option, value) => option?.key === value?.key}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        id="customer-order-number"
                                        label="Customer Order Number"
                                        type="text"
                                        error={
                                            formError && !isValidOrderReference(temporaryDelivery)
                                        }
                                        value={temporaryDelivery?.customerOrderNumber ?? ''}
                                        onChange={(event) =>
                                            setTemporaryDelivery({ ...temporaryDelivery, customerOrderNumber: event.target.value })
                                        }
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <Input
                                        id="customer-order-position-number"
                                        label="Customer Order Position"
                                        type="text"
                                        error={
                                            formError &&
                                            !isValidOrderReference(temporaryDelivery)
                                        }
                                        value={temporaryDelivery?.customerOrderPositionNumber ?? ''}
                                        onChange={(event) =>
                                            setTemporaryDelivery({
                                                ...temporaryDelivery,
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
                                        error={
                                            formError && !isValidOrderReference(temporaryDelivery)
                                        }
                                        value={temporaryDelivery?.supplierOrderNumber ?? ''}
                                        onChange={(event) =>
                                            setTemporaryDelivery({ ...temporaryDelivery, supplierOrderNumber: event.target.value })
                                        }
                                    />
                                </Grid>
                            </>
                        ) : (
                            <Grid item xs={12}>
                                {<Table
                                    title={`Deliveries ${
                                        temporaryDelivery?.dateOfDeparture
                                            ? ' on ' +
                                              new Date(temporaryDelivery?.dateOfDeparture).toLocaleDateString('en-UK', {
                                                  weekday: 'long',
                                                  day: '2-digit',
                                                  month: '2-digit',
                                                  year: 'numeric',
                                              })
                                            : ''
                                    }`}
                                    density='standard'
                                    getRowId={(row) => row.uuid}
                                    columns={createDeliveryColumns(handleDelete)}
                                    rows={dailyDeliveries}
                                    hideFooter
                                />}
                            </Grid>
                        )}
                    </Grid>
                    <Box display="flex" gap="1rem" width="100%" justifyContent="end" marginTop="2rem">
                        <Button variant="outlined" color="primary" sx={{ display: 'flex', gap: '.25rem' }} onClick={onClose}>
                            <Close></Close> Close
                        </Button>
                        {mode === 'create' && (
                            <Button
                                variant="contained"
                                color="primary"
                                sx={{ display: 'flex', gap: '.25rem' }}
                                onClick={() => handleSaveClick()}
                            >
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
