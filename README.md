# google-home-voicetext-dashbutton
Amazonダッシュボタンを押して、Google Homeに喋らせる仕組みです。

[google-home-voicetext-server](https://github.com/yasu-hide/google-home-voicetext-server)と合わせて使用できます。

## 設定できる項目 (dashbutton.json)
```
{
    "{MAC_ADDR}": {
        "message": "{MESSAGE}",
        "speaker": "{SPEAKER}",
        "emotion": "{EMOTION}",
        "emotion_level": "{EMOTION_LEVEL}",
        "servers": [
            "{SERVER}"
        ]
    },
    ...
}
```

### MAC_ADDR (必須)
AmazonダッシュボタンのMACアドレスです。

#### 検出方法
node-dash-buttonに同梱されるfindbuttonプログラムでARPパケットを傍受してください。
```
$ docker run --rm --net=host --name detect_dashbutton \
    vet5lqplpecmpnqb/google-home-voicetext-dashbutton \
    node_modules/node-dash-button/bin/findbutton | tee dashbutton.log &
$ tail -f dashbutton.log | grep -e Amazon -e unknown
```
記録から`Amazon Technologies Inc.`または`unknown`が含まれる行を抽出して、MACアドレス(物理アドレス)を把握します。
```
Possible dash hardware address detected: 00:00:de:ad:be:ef Manufacturer: unknown Protocol: arp
Possible dash hardware address detected: 00:00:fe:e1:de:ad Manufacturer: Amazon Technologies Inc. Protocol: arp
```
確認が終わったら停止し、ログファイルを削除します。
```
$ kill %1
$ docker stop detect_dashbutton
$ rm -f dashbutton.log
```

### MESSAGE (必須)
Google Homeに喋らせるメッセージです。

### SERVERS (必須)
google-home-voicetext-serverが起動しているサーバのURLです。

### SPEAKER (任意)
話者を指定できます。

設定できる項目は、[VoiceTextのAPIマニュアル](https://cloud.voicetext.jp/webapi/docs/api)のパラメータを参照してください。

未指定の場合は、`HIKARI`が設定されます。

### EMOTION (任意)
話者の感情を指定できます。

設定できる項目は、[VoiceTextのAPIマニュアル](https://cloud.voicetext.jp/webapi/docs/api)のパラメータを参照してください。

未指定の場合は、`HAPPINESS`が設定されます。

### EMOTION_LEVEL (任意)
話者の感情レベルを指定できます。

未指定の場合は、`NORMAL`が設定されます。

設定できる項目は、[google-home-voicetext-serverのREADME](https://github.com/yasu-hide/google-home-voicetext-server#voicetext_emotion_level-%E4%BB%BB%E6%84%8F)のパラメータを参照してください。

## 設定例
`00:00:de:ad:be:ef`のAmazonダッシュボタンが押されたとき、

`192.168.20.140`で起動しているgoogle-home-voicetext-serverを使って、

`192.168.20.200`のGoogle Homeに`「こんにちは、Googleです。」`を喋らせます。

話者設定は`hikari`、感情は`HAPPINESS`、感情レベルは`HIGH`です。

```
{
    "00:00:de:ad:be:ef": {
        "message": "こんにちは、Googleです。",
        "speaker": "hikari",
        "emotion": "happiness",
        "emotion_level": "high",
        "servers": [
            "http://192.168.20.140/192.168.20.200"
        ]
    }
}
```

# docker-compose

## dashbutton.json準備

```
$ vi dashbutton.json
```
上記の`dashbutton.json`設定を参照してください。

## 適用(up)
```
$ docker-compose up -d
```

## 技術的な補足
以下の理由から、同梱するdocker-compose-ymlでは __ホストネットワーク__ (`network_mode: host`)を指定しています。

そのため、k8sでは正しく動作しない可能性があります。

### Amazonダッシュボタンと同一L2で動作する必要がある
Amazonダッシュボタンでボタンを押下すると発行されるARPリクエストを捕らえています。

同一L2内で、インターフェイスをプロミスキャス(無差別)モードにする必要があります。

dockerの標準ネットワーク(docker0)はiptablesの別L2でNATされるため、AmazonダッシュボタンのARPリクエストを捕捉できません。

### MACVLANはホストに接続できない

MACVLANを指定(`networks: [ macvlan ]`)して、同一ホストでgoogle-home-voicetext-serverを動かす場合は、

MACVLANの制約でホストのインターフェイス設定に手を加えないと接続できず、エラーが発生します。

