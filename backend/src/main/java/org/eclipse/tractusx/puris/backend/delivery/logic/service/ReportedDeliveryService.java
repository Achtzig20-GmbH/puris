package org.eclipse.tractusx.puris.backend.delivery.logic.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Stream;

import org.eclipse.tractusx.puris.backend.delivery.domain.model.ReportedDelivery;
import org.eclipse.tractusx.puris.backend.delivery.domain.repository.ReportedDeliveryRepository;
import org.springframework.stereotype.Service;

@Service
public class ReportedDeliveryService {
    public final ReportedDeliveryRepository repository;

    protected final Function<ReportedDelivery, Boolean> validator;

    public ReportedDeliveryService(ReportedDeliveryRepository repository) {
        this.repository = repository;
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

    public final List<ReportedDelivery> findAllByFilters(Optional<String> ownMaterialNumber, Optional<String> bpnl) {
        Stream<ReportedDelivery> stream = repository.findAll().stream();
        if (ownMaterialNumber.isPresent()) {
            stream = stream.filter(delivery -> delivery.getMaterial().getOwnMaterialNumber().equals(ownMaterialNumber.get()));
        }
        if (bpnl.isPresent()) {
            stream = stream.filter(delivery -> delivery.getPartner().getBpnl().equals(bpnl.get()));
        }
        return stream.toList();
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
            delivery.getTrackingNumber() != null &&
            delivery.getIncoterm() != null &&
            !(delivery.isHasDeparted() == false && delivery.isHasArrived() == true) &&
            !delivery.getPartner().getSites().stream().anyMatch(site -> site.getBpns().equals(delivery.getDestinationBpns())) &&
            ((
                delivery.getCustomerOrderNumber() != null && 
                delivery.getCustomerOrderPositionNumber() != null &&
                delivery.getSupplierOrderNumber() != null
            ) || (
                delivery.getCustomerOrderNumber() == null && 
                delivery.getCustomerOrderPositionNumber() == null &&
                delivery.getSupplierOrderNumber() == null
            ));
    }
}