CREATE TABLE IF NOT EXISTS todos (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

INSERT INTO todos (id, title, description, completed) VALUES
('01994768-948a-759a-a485-3ccbb2f3a502', '1_Berkshire emulation deposit Sri Bacon', '1_I''ll index the redundant RSS firewall, that should microchip the PCI program!', false),
('02994768-948a-759a-a485-3ccbb2f3a502', '2_Berkshire emulation deposit Sri Bacon', '2_I''ll index the redundant RSS firewall, that should microchip the PCI program!', false),
('03994768-948a-759a-a485-3ccbb2f3a502', '3_Berkshire emulation deposit Sri Bacon', '3_I''ll index the redundant RSS firewall, that should microchip the PCI program!', false);
