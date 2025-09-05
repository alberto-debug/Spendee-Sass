package com.alberto.Spendee.sass.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class KeepAliveService {

    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Faz uma requisição a cada 4 minutos para evitar inatividade
    @Scheduled(fixedRate = 240000) // 240000 ms = 4 minutos
    public void keepApplicationAlive() {
        String appUrl = "https://localhost:8080/health"; // Troque para a URL da sua aplicação se estiver em produção

        try {
            URL url = new URL(appUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            int responseCode = connection.getResponseCode();

            System.out.println("[" + LocalDateTime.now().format(formatter) + "] Keep-alive request feita. Status: " + responseCode);
        } catch (Exception e) {
            System.err.println("Erro ao fazer keep-alive request: " + e.getMessage());
        }
    }
}