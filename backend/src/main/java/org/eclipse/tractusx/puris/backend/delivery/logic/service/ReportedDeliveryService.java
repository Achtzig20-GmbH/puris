/*
 * Copyright (c) 2024 Volkswagen AG
 * Copyright (c) 2024 Contributors to the Eclipse Foundation
 *
 * See the NOTICE file(s) distributed with this work for additional
 * information regarding copyright ownership.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Apache License, Version 2.0 which is available at
 * https://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

package org.eclipse.tractusx.puris.backend.delivery.logic.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Stream;

import org.eclipse.tractusx.puris.backend.delivery.domain.model.EventTypeEnumeration;
import org.eclipse.tractusx.puris.backend.delivery.domain.model.ReportedDelivery;
import org.eclipse.tractusx.puris.backend.delivery.domain.repository.ReportedDeliveryRepository;
import org.eclipse.tractusx.puris.backend.delivery.logic.dto.DeliveryQuantityDto;
import org.eclipse.tractusx.puris.backend.masterdata.domain.model.Partner;
import org.eclipse.tractusx.puris.backend.masterdata.logic.service.PartnerService;
import org.springframework.stereotype.Service;

@Service
public class ReportedDeliveryService {
    private final ReportedDeliveryRepository repository;

    private final PartnerService partnerService;

    protected final Function<ReportedDelivery, Boolean> validator;

    private Partner ownPartnerEntity;

    public ReportedDeliveryService(ReportedDeliveryRepository repository, PartnerService partnerService) {
        this.repository = repository;
        this.partnerService = partnerService;
        this.validator = this::validate;
    }

    public final List<ReportedDelivery> findAll() {
        return repository.findAll();
    }

    public final List<ReportedDelivery> findAllByReportedId(UUID reportedId) {
        return repository.findAll().stream().filter(delivery -> delivery.getPartner().getUuid().equals(reportedId))
            .toList();
    }

    public final ReportedDelivery findById(UUID id) {
        return repository.findById(id).orElse(null);
    }

    public final List<ReportedDelivery> findAllByFilters(
        Optional<String> ownMaterialNumber,
        Optional<String> bpns,
        Optional<String> bpnl,
        Optional<Date> day,
        Optional<Boolean> incoming) {
        Stream<ReportedDelivery> stream = repository.findAll().stream();
        if (ownMaterialNumber.isPresent()) {
            stream = stream.filter(delivery -> delivery.getMaterial().getOwnMaterialNumber().equals(ownMaterialNumber.get()));
        }
        if (bpns.isPresent()) {
            if (incoming.isPresent()) {
                if (incoming.get() == true) {
                    stream = stream.filter(delivery -> delivery.getDestinationBpns().equals(bpns.get()));
                } else {
                    stream = stream.filter(delivery -> delivery.getOriginBpns().equals(bpns.get()));
                }
            } else {
                stream = stream.filter(delivery -> delivery.getDestinationBpns().equals(bpns.get()) || delivery.getOriginBpns().equals(bpns.get()));
            }
        }
        if (bpnl.isPresent()) {
            stream = stream.filter(delivery -> delivery.getPartner().getBpnl().equals(bpnl.get()));
        }
        if (day.isPresent()) {
            LocalDate localDayDate = Instant.ofEpochMilli(day.get().getTime())
                .atOffset(ZoneOffset.UTC)
                .toLocalDate();
            stream = stream.filter(delivery -> {
                long time = incoming.get() ? delivery.getDateOfArrival().getTime() : delivery.getDateOfDeparture().getTime();
                LocalDate deliveryDayDate = Instant.ofEpochMilli(time)
                    .atOffset(ZoneOffset.UTC)
                    .toLocalDate();
                return deliveryDayDate.getDayOfMonth() == localDayDate.getDayOfMonth();
            });
        }
        return stream.toList();
    }

    public final double getSumOfQuantities(List<ReportedDelivery> deliveries) {
        double sum = 0;
        for (ReportedDelivery delivery : deliveries) {
            sum += delivery.getQuantity();
        }
        return sum;
    }

    public final List<DeliveryQuantityDto> getQuantityForDays(String material, String partnerBpnl, String siteBpns, boolean incoming, int numberOfDays) {
        List<DeliveryQuantityDto> deliveryQtys = new ArrayList<>();
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(new Date());

        for (int i = 0; i < numberOfDays; i++) {
            Date date = calendar.getTime();
            List<ReportedDelivery> deliveries = findAllByFilters(Optional.of(material), Optional.of(partnerBpnl), Optional.of(siteBpns), Optional.of(date), Optional.of(incoming));
            double deliveryQuantity = getSumOfQuantities(deliveries);
            deliveryQtys.add(new DeliveryQuantityDto(date, deliveryQuantity));

            calendar.add(Calendar.DAY_OF_MONTH, 1);
            date = calendar.getTime();
        }
        return deliveryQtys;
    }

    public final ReportedDelivery create(ReportedDelivery delivery) {
        if (delivery.getUuid() != null && repository.findById(delivery.getUuid()).isPresent()) {
            return null;
        }
        if (!validator.apply(delivery)) {
            return null;
        }
        return repository.save(delivery);
    }

    public final List<ReportedDelivery> createAll(List<ReportedDelivery> deliveries) {
        if (deliveries.stream().anyMatch(delivery -> !validator.apply(delivery))) {
            return null;
        }
        if (repository.findAll().stream()
                .anyMatch(existing -> deliveries.stream().anyMatch(delivery -> delivery.equals(existing)))) {
            return null;
        }
        return repository.saveAll(deliveries);
    }

    public final ReportedDelivery update(ReportedDelivery delivery) {
        if (delivery.getUuid() == null || repository.findById(delivery.getUuid()).isEmpty()) {
            return null;
        }
        return repository.save(delivery);
    }

    public final void delete(UUID id) {
        repository.deleteById(id);
    }

    public boolean validate(ReportedDelivery delivery) {
        return 
            delivery.getQuantity() > 0 && 
            delivery.getMeasurementUnit() != null &&
            delivery.getMaterial() != null &&
            delivery.getPartner() != null &&
            validateResponsibility(delivery) &&
            validateTransitEvent(delivery) &&
            ((
                delivery.getCustomerOrderNumber() != null && 
                delivery.getCustomerOrderPositionNumber() != null 
            ) || (
                delivery.getCustomerOrderNumber() == null && 
                delivery.getCustomerOrderPositionNumber() == null &&
                delivery.getSupplierOrderNumber() == null
            ));
    }

    private boolean validateTransitEvent(ReportedDelivery delivery) {
        var now = new Date().getTime();
        return
            delivery.getDepartureType() != null &&
            (delivery.getDepartureType() == EventTypeEnumeration.ESTIMATED_DEPARTURE || delivery.getDepartureType() == EventTypeEnumeration.ACTUAL_DEPARTURE) &&
            delivery.getArrivalType() != null &&
            (delivery.getArrivalType() == EventTypeEnumeration.ESTIMATED_ARRIVAL || delivery.getArrivalType() == EventTypeEnumeration.ACTUAL_ARRIVAL) &&
            !(delivery.getDepartureType() == EventTypeEnumeration.ESTIMATED_DEPARTURE && delivery.getArrivalType() == EventTypeEnumeration.ACTUAL_ARRIVAL) &&
            delivery.getDateOfDeparture().getTime() < delivery.getDateOfArrival().getTime() && 
            (delivery.getArrivalType() != EventTypeEnumeration.ACTUAL_ARRIVAL || delivery.getDateOfArrival().getTime() < now) &&
            (delivery.getDepartureType() != EventTypeEnumeration.ACTUAL_DEPARTURE || delivery.getDateOfDeparture().getTime() < now);
    }

    private boolean validateResponsibility(ReportedDelivery delivery) {
        if (ownPartnerEntity == null) {
            ownPartnerEntity = partnerService.getOwnPartnerEntity();
        }
        return delivery.getIncoterm() != null && switch (delivery.getIncoterm().getResponsibility()) {
            case CUSTOMER ->
                delivery.getMaterial().isProductFlag() &&
                ownPartnerEntity.getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getOriginBpns())) &&
                delivery.getPartner().getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getDestinationBpns()));
            case SUPPLIER ->
                delivery.getMaterial().isMaterialFlag() &&
                delivery.getPartner().getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getOriginBpns())) &&
                ownPartnerEntity.getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getDestinationBpns()));
            case PARTIAL ->
                (
                    delivery.getMaterial().isMaterialFlag() &&
                    ownPartnerEntity.getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getDestinationBpns())) &&
                    delivery.getPartner().getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getOriginBpns()))
                    
                ) || (
                    delivery.getMaterial().isProductFlag() &&
                    delivery.getPartner().getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getDestinationBpns())) &&
                    ownPartnerEntity.getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getOriginBpns()))
                );
        };
    }
}
