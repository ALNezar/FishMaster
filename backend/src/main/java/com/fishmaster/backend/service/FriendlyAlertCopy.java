package com.fishmaster.backend.service;

import com.fishmaster.backend.model.Alert;

import java.math.BigDecimal;

public final class FriendlyAlertCopy {

    private FriendlyAlertCopy() {}

    public record FriendlyMessage(String title, String body, String iconKey, String actionHint) {}

    public static FriendlyMessage forAlert(Alert alert) {
        if (alert == null) {
            return new FriendlyMessage("Fish need attention", "Check your tank when you can.", "fish", "Open Tank Advisor");
        }
        boolean low = alert.getThresholdLow() != null
                && alert.getValue().compareTo(alert.getThresholdLow()) < 0;
        return forMetric(alert.getMetric(), low, alert.getSeverity().name());
    }

    public static FriendlyMessage forMetric(String metric, boolean violatesLow, String severity) {
        String m = metric == null ? "" : metric.toLowerCase();
        return switch (m) {
            case "temperature" -> violatesLow
                    ? new FriendlyMessage("Brr! Water is chilly", "Your fish might feel cold.", "temperature", "Warm the tank slowly")
                    : new FriendlyMessage("Water is getting warm", "Keep an eye on your fish.", "temperature", "Check the heater");
            case "ph" -> violatesLow
                    ? new FriendlyMessage("Water is a bit acidic", "A small water check helps.", "ph", "Test the water")
                    : new FriendlyMessage("Water balance is shifting", "pH is moving up a little.", "ph", "Test the water");
            case "turbidity" -> new FriendlyMessage("Tank is a bit cloudy", "A quick filter check might help.", "turbidity", "Check the filter");
            default -> new FriendlyMessage("Something needs a look", "Your tank sent a friendly heads-up.", "fish", "Open Tank Advisor");
        };
    }

    public static FriendlyMessage forLiveReading(String metric, BigDecimal value, BigDecimal low, BigDecimal high) {
        if (value == null) {
            return forMetric(metric, false, "WARNING");
        }
        boolean violatesLow = low != null && value.compareTo(low) < 0;
        boolean violatesHigh = high != null && value.compareTo(high) > 0;
        if (!violatesLow && !violatesHigh) {
            return null;
        }
        return forMetric(metric, violatesLow, "WARNING");
    }

    public static String pushTitle(FriendlyMessage msg) {
        return msg.title();
    }

    public static String pushBody(FriendlyMessage msg) {
        return msg.body();
    }
}
