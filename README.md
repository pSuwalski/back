#Usuwanie faktur i wypłat z zamówień
`UPDATE orders SET "withdrawId"=null,"invoiceId"=null WHERE "invoiceId"<>'1/02/2016';`

`SELECT COUNT(*) from orders where status = 'delivered';`

`SELECT "assignedDriverID" from orders WHERE status = 'delivered' ORDER BY "createdAt" ASC LIMIT 1 OFFSET 999;`

UPDATE withdraws SET "isPayed"=true,"transactionId"='FT16095330450006' WHERE id='1/04/2016';
UPDATE withdraws SET "isPayed"=true,"transactionId"='FT16095109247010' WHERE id='2/04/2016';
UPDATE withdraws SET "isPayed"=true,"transactionId"='FT16095109249461' WHERE id='3/04/2016';
UPDATE withdraws SET "isPayed"=true,"transactionId"='FT16095330466900' WHERE id='4/04/2016';
UPDATE withdraws SET "isPayed"=true,"transactionId"='FT16095452422925' WHERE id='6/04/2016';
UPDATE withdraws SET "isPayed"=true,"transactionId"='FT16095452432483' WHERE id='7/04/2016';
UPDATE withdraws SET "isPayed"=true,"transactionId"='FT16095330494008' WHERE id='9/04/2016';

curl -i https://lunch24-node-worker.herokuapp.com/lunchbot/products \
-H "Authorization: Bearer 5GEhL5gz6j" \
-H "Content-Type: application/json"

curl -i https://lunch24-node-worker.herokuapp.com/lunchbot/orders \
-H "Authorization: Bearer 5GEhL5gz6j" \
-H "Content-Type: application/json"

curl -i https://lunch24-node-worker.herokuapp.com/lunchbot/addresses/793130308 \
-H "Authorization: Bearer 5GEhL5gz6j" \
-H "Content-Type: application/json"

curl -X POST -i https://lunch24-node-worker.herokuapp.com/lunchbot/orders \
-H "Authorization: Bearer 5GEhL5gz6j" \
-H "Content-Type: application/json" \
-d '{"to": {"address": "Korfantego 30", "phone": "666777888"}, "cart": [{"count": 1, "product_id": "-K8QOKEiqIY0J6Crc3hC"}], "payment_type": "cc"}'


UPDATE orders SET "statusCode"=100 WHERE status='canceled';
UPDATE orders SET "ourCommission"=0 WHERE status='canceled';

UPDATE orders SET "withdrawId"=null,"invoiceId"=null where "invoiceId" IN ('18/05/2016', '19/05/2016', '20/05/2016', '21/05/2016', '22/05/2016', '23/05/2016', '24/05/2016', '25/05/2016', '26/05/2016', '27/05/2016', '28/05/2016', '29/05/2016', '30/05/2016', '31/05/2016', '32/05/2016', '33/05/2016', '34/05/2016', '35/05/2016', '36/05/2016', '37/05/2016', '38/05/2016', '39/05/2016', '40/05/2016', '41/05/2016', '42/05/2016', '43/05/2016', '44/05/2016', '45/05/2016', '46/05/2016', '47/05/2016', '48/05/2016', '49/05/2016', '50/05/2016', '51/05/2016', '52/05/2016', '53/05/2016', '54/05/2016', '55/05/2016', '56/05/2016', '57/05/2016', '58/05/2016', '59/05/2016', '60/05/2016', '61/05/2016');


ALTER TABLE orders ADD COLUMN acceptedByRestaurantAt DATE;
ALTER TABLE orders ADD COLUMN cookingDuration INTEGER;