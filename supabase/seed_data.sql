ALTER TABLE terrains ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);

INSERT INTO terrains (name, city, neighborhood, address, description, price_per_hour, orange_money_number, guardian_phone, latitude, longitude, opening_time, closing_time) VALUES
('Terrain Faladje', 'Bamako', 'Faladje', 'Quartier Faladje, Hamdallaye', 'Grand terrain synthetique avec eclairage nocturne. Arbitres disponibles.', 15000, '+22376000001', '+22377000001', 12.6392, -8.0029, '07:00', '23:00'),
('Terrain Badalabougou', 'Bamako', 'Badalabougou', 'Centre sportif Badalabougou', 'Terrain en terre battue, ideal pour les matchs amicaux.', 8000, '+22376000002', '+22377000002', 12.6450, -8.0100, '06:00', '22:00'),
('Terrain Magnambougou', 'Bamako', 'Magnambougou', 'Derriere le marche Magnambougou', 'Terrain cloture avec vestiaires et douches.', 10000, '+22376000003', '+22377000003', 12.6200, -7.9800, '07:00', '22:00'),
('Terrain Missabougou', 'Bamako', 'Missabougou', 'A cote de l ecole primaire Missabougou', 'Terrain municipal, bon etat, filets inclus.', 7000, '+22376000004', '+22377000004', 12.6500, -8.0200, '06:30', '21:30'),
('Terrain Koulouba', 'Bamako', 'Koulouba', 'Pres du stade regional Koulouba', 'Terrain premium avec tribune et eclairage LED.', 20000, '+22376000005', '+22377000005', 12.6600, -7.9900, '06:00', '00:00'),
('Terrain Sikasso Centre', 'Sikasso', 'Centre-ville', 'Avenue de la Republique, Sikasso', 'Terrain central avec vue sur le marche.', 6000, '+22376000006', '+22377000006', 11.3175, -5.6664, '07:00', '21:00'),
('Terrain Sikasso Stade', 'Sikasso', 'Quartier Stade', 'Pres du stade de Sikasso', 'Terrain officiel, pelouse naturelle.', 8000, '+22376000007', '+22377000007', 11.3200, -5.6700, '06:00', '22:00'),
('Terrain Mopti Komoguel', 'Mopti', 'Komoguel', 'Quartier Komoguel, Mopti', 'Terrain au bord du fleuve, ambiance unique.', 5000, '+22376000008', '+22377000008', 14.4858, -4.1833, '07:00', '20:00'),
('Terrain Mopti Sevare', 'Mopti', 'Sevare', 'Route de Sevare, sortie de Mopti', 'Grand terrain avec parking, proche de l aeroport.', 7000, '+22376000009', '+22377000009', 14.5000, -4.2500, '06:30', '21:30'),
('Terrain Koulikoro Sud', 'Koulikoro', 'Quartier Sud', 'Avenue principale, Koulikoro', 'Terrain bien entretenu, ombre naturelle.', 5000, '+22376000010', '+22377000010', 12.8667, -7.5500, '07:00', '21:00'),
('Terrain Segou Barbecue', 'Segou', 'Baradji', 'Quartier Baradji, Segou', 'Terrain populaire, ambiance festive le weekend.', 6000, '+22376000011', '+22377000011', 13.4317, -6.2153, '07:00', '22:00'),
('Terrain Segou Place', 'Segou', 'Place FAO', 'Pres de la Place FAO, Segou', 'Terrain central, accessible a tous.', 4000, '+22376000012', '+22377000012', 13.4400, -6.2200, '06:00', '21:00'),
('Terrain Kayes Zone', 'Kayes', 'Zone Industrielle', 'Zone industrielle, Kayes', 'Terrain spacieux avec facilities modernes.', 7000, '+22376000013', '+22377000013', 14.4400, -11.4400, '07:00', '22:00'),
('Terrain Koutiala Centre', 'Koutiala', 'Centre-ville', 'Centre-ville de Koutiala', 'Terrain municipal bien eclaire.', 4000, '+22376000014', '+22377000014', 12.3917, -5.3644, '06:30', '21:00'),
('Terrain San Centre', 'San', 'Quartier Marche', 'Pres du marche de San', 'Terrain communautaire, chaleureux.', 3000, '+22376000015', '+22377000015', 13.3000, -4.9000, '07:00', '20:00');

CREATE POLICY "Users can view all active terrains" ON terrains FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can manage their terrains" ON terrains FOR ALL USING (
    auth.uid() = owner_id
);
