package com.alberto.Spendee.sass.controller;

import com.alberto.Spendee.sass.domain.user.User;
import com.alberto.Spendee.sass.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Get current user info
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("User not found");
        Map<String, Object> result = new HashMap<>();
        result.put("firstName", user.getFirstName());
        result.put("lastName", user.getLastName());
        result.put("email", user.getEmail());
        result.put("photoUrl", "/api/user/photo");
        return ResponseEntity.ok(result);
    }

    // Update user info and photo
    @PostMapping(value = "/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updateUser(
            Principal principal,
            @RequestParam("firstName") String firstName,
            @RequestParam("lastName") String lastName,
            @RequestParam("email") String email,
            @RequestParam(value = "photo", required = false) MultipartFile photo
    ) {
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body("User not found");

        // Update name
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);

        // Save photo as bytes with compression
        if (photo != null && !photo.isEmpty()) {
            try {
                byte[] compressedImage = compressImage(photo.getBytes(), photo.getContentType());
                user.setPhoto(compressedImage);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body("Error uploading photo: " + e.getMessage());
            }
        }

        userRepository.save(user);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        return ResponseEntity.ok(result);
    }

    // Serve user photo with no-cache headers to avoid stale images after update
    @GetMapping("/photo")
    public ResponseEntity<?> getPhoto(Principal principal) {
        User user = userRepository.findByEmail(principal.getName()).orElse(null);
        if (user == null || user.getPhoto() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_JPEG)
                .cacheControl(CacheControl.noStore().mustRevalidate())
                .header(HttpHeaders.PRAGMA, "no-cache")
                .header(HttpHeaders.EXPIRES, "0")
                .body(user.getPhoto());
    }

    /**
     * Compresses an image to reduce its size
     * @param imageData The original image bytes
     * @param contentType The mime type of the image
     * @return Compressed image bytes
     */
    private byte[] compressImage(byte[] imageData, String contentType) throws Exception {
        // Read the image
        BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(imageData));
        if (originalImage == null) {
            throw new Exception("Failed to read image data");
        }

        // Calculate new dimensions (max 800px width/height)
        int maxDimension = 800;
        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        double scale = 1.0;

        if (width > height && width > maxDimension) {
            scale = (double)maxDimension / width;
        } else if (height > width && height > maxDimension) {
            scale = (double)maxDimension / height;
        }

        int scaledWidth = (int)(width * scale);
        int scaledHeight = (int)(height * scale);

        // Create a scaled version of the image
        Image scaledImage = originalImage.getScaledInstance(scaledWidth, scaledHeight, Image.SCALE_SMOOTH);
        BufferedImage compressedImage = new BufferedImage(scaledWidth, scaledHeight, BufferedImage.TYPE_INT_RGB);

        Graphics2D g2d = compressedImage.createGraphics();
        g2d.drawImage(scaledImage, 0, 0, null);
        g2d.dispose();

        // Convert to JPEG with compression
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(compressedImage, "jpeg", outputStream);

        return outputStream.toByteArray();
    }
}
