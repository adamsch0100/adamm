This document provides detailed API descriptions, syntax, parameter explanations, and examples, allowing you to manage cloud phone service resources through API calls.

Change Log
2025-05-21

Added Upload user image interface
2025-04-21

Updated Instance Restart (Restart to Change Network IP) interface
2025-04-09

Added Android image version collection interface
Added Cloud machine simulated touch interface
2025-03-29

Added Equipment Pre-sale Purchase interface
Added Query pre-sale order result details interface
2025-03-20

Added Query the list of countries supported by one-click new machine interface
Added Get real machine template by page interface
Updated One-Click New Device interface
2025-03-12

Updated Modify Contacts API
Added Modify instance wifi attributes API
2025-03-04

Added Switch Device API
Added Set keepalive application interface API
2025-02-27

Added File upload interface directly through link API
2025-02-26

Added Modify sim card information according to country code API
2025-02-20

Added Instance installed application list query API
2025-02-12

Updated Create Automated Task API Support adding video like and comment tasks
2025-02-08

Updated Instance File Upload Callback API
Updated Set Smart IP API
Updated Set Smart IP API
Added Equipment task execution result query API
2025-02-07

Updated Intelligent IP Proxy Check API
2025-02-06

Added Switch Root Permission API
Added Cloud Phone Status Example description
Optimized Automated Task Type Request Parameter description
2025-01-26

Added Query Instance Properties API
Added Batch Query Instance Properties API
Added Modify Instance Properties API
Updated Modify Contacts API
Added Modify Real Machine ADI Template API
2025-01-23

Added Intelligent IP Proxy Check API
Added Set Smart IP API
Added Cancel Intelligent IP API
2025-01-22

Added GET request to retrieve signature JAVA example demo
2025-01-21

Added SKU Package List API
Optimized Create Cloud Phone API to support renewal functionality
2025-01-16

Added Local Screenshot API
Added Get SDK Temporary Token by padCode API
Added Get SDK Temporary Token API
Added Clear SDK Authorization Token API
Added Upgrade Image API
Added Upgrade Real Machine Image API
2025-01-08

Added Automated Task List Query API
Added Create Automated Task API
Added Cancel Automated Task API
Added Retry Automated Task API
Added Application Details API
2025-01-07

Added Create Cloud Phone API
Added Cloud Phone List API
Added Cloud Phone Information Query API
Added Modify Instance Time Zone API
Added Modify Instance Language API
Added Set Instance Latitude/Longitude API
Added Uninstall App API
Added Start App API
Added Stop App API
Added Restart App API
2024-12-17

Added File Upload API
Added Instance File Upload API
2024-12-12

Added Instance Proxy Settings API
Added One-Click New Device API
2024-12-09

Added Modify Contacts API
Added Application Upload API
Added File Task Details API
Added Application Installation API
2024-12-09

Document Release
API Request Instructions
Prerequisites
Obtain the Access Key ID and Secret Access Key (AK/SK) of your account for API request authentication. Please contact the technical contact person to obtain them.

Common Request Parameters
Each API request must include the following four parameters in the Headers for authentication; otherwise, the API request will not work properly.

Parameter Name	Type	Example Value	Description
x-date	string	20240301T093700Z	The timestamp of the request, in UTC, accurate to the second
x-host	string	openapi.armcloud.net	The domain for accessing the API
authorization	string	HMAC-SHA256 Credential={AccessKey}, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature={Signature}	The signature included in the request
Content-Type	string	application/json	The MIME type of the resource
Authorization Signature Mechanism
For each HTTPS protocol request, the identity of the requester is verified based on the signature information in the request. This is achieved through encryption and validation using the AccessKey ID and AccessKey Secret (AK/SK) associated with the user account.

Manual Signature
Note

The signature requires a series of processing steps for the request parameters, including sorting, concatenation, and encryption. This method provides greater flexibility and customization, making it suitable for developers who have a deep understanding of the signature algorithm. However, manual signing requires developers to write additional code to implement the signing process, which may increase development complexity and the potential for errors. Therefore, we still recommend using the SDK to call the API and try to avoid writing signature code by hand. If you need to understand the principles and detailed process of signature calculation, you can refer to the following documentation.

The manual signature mechanism requires the requester to calculate the hash value of the request parameters, which is then encrypted and sent to the server along with the API request. The server will calculate the signature of the received request using the same mechanism and compare it with the signature provided by the requester. If the signature verification fails, the request will be rejected.

Obtain the Access Key ID and Secret Access Key (AK/SK) of your account for API request authentication. Please contact the technical contact person to obtain them.

Constructing the Canonical Request String (CanonicalRequest)

 String canonicalStringBuilder=
 	"host:"+*${host}*+"\n"+
 	"x-date:"+*${xDate}*+"\n"+
 	"content-type:"+*${contentType}*+"\n"+
 	"signedHeaders:"+*${signedHeaders}*+"\n"+
 	"x-content-sha256:"+*${xContentSha256}*；
Field	Description
host	The service domain of the request. Fixed to: api.vmoscloud.com
x-date	Refers to the UTC time of the request, which is the value of the X-Date header in the public parameters. It follows the ISO 8601 standard format: YYYYMMDD'T'HHMMSS'Z', for example: 20201103T104027Z
content-type	The media type of the request or response body(application/json)
signedHeaders	Headers involved in signing. They correspond one-to-one with the CanonicalHeaders. The purpose is to specify which headers are involved in the signing calculation, thereby ignoring any extra headers added by a proxy. The headers host and x-date, if present, must be included.
Pseudocode example:
SignedHeaders=Lowercase(HeaderName0)+';'+Lowercase(HeaderName1)+";"+...+Lowercase(HeaderNameN)
Example:
SignedHeaders=content-type;host;x-content-sha256;x-date
x-content-sha256	hashSHA256(body) Note: the body should be trimmed of spaces before calculating hashSHA256
Construct the string to be signed (StringToSign)
The signature string primarily contains metadata about the request and the canonicalized request. It consists of the signature algorithm, request date, credential, and the hash value of the canonicalized request.

To construct the StringToSign, the pseudocode is as follows:


StringToSign=
	Algorithm+'\n'+
	xDate+'\n'+
	CredentialScope+'\n'+
	hashSHA256(canonicalStringBuilder.getByte())
Field	Description
Algorithm	Refers to the signature algorithm, currently only HMAC-SHA256 is supported.
x-date	Refers to the UTC time of the request, which is the value of the X-Date header in the public parameters. It follows the ISO 8601 standard format: YYYYMMDD'T'HHMMSS'Z', for example: 20201103T104027Z
CredentialScope	Refers to the credential, formatted as: ${YYYYMMDD}/${service}/request, where ${YYYYMMDD} is the date from X-Date, ${service} is fixed as armcloud-paas, and request is a fixed value.
See below for "Calculating CredentialScope"
CanonicalRequest	Refers to the result of constructing the canonical request string.
                      |
Calculating CredentialScope

String credentialScope = shortXDate+"/"+service+"/request";
    shortXDate: Short request time (the first 8 digits of x-date, for example: 20201103)
    service: Service name (fixed as armcloud-paas)
    "/request": Fixed value
Signingkey Example
HMAC Hash Operation Sequence to Generate the Derived Signing Key


byte[]Signingkey=hmacSHA256(hmacSHA256(hmacSHA256(sk.getBytes(),shortXDate),service),”request”);
Field	Description
sk	Customer's secret key
shortXDate	Short request date
Service	Service name, temporarily fixed as armcloud-paas
Signature Example

signature=HexEncode(hmacSHA256(Signingkey,StringToSign))
Signature Generation Utility Class Example (Java)

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;

public class PaasSignUtils {

    public static final String service = "armcloud-paas";

    public static String signature(String contentType, String signedHeaders, String host, String xDate, String sk, byte[] body) throws Exception {

        if (body == null) {
            body = new byte[0];
        }
        String xContentSha256 = hashSHA256(body);
        String shortXDate = xDate.substring(0, 8);

        String canonicalStringBuilder = "host:" + host + "\n" + "x-date:" + xDate + "\n" + "content-type:" + contentType + "\n" + "signedHeaders:" + signedHeaders + "\n" + "x-content-sha256:" + xContentSha256;

        String hashcanonicalString = hashSHA256(canonicalStringBuilder.getBytes());

        String credentialScope = shortXDate + "/" + service + "/request";
        String signString = "HMAC-SHA256" + "\n" + xDate + "\n" + credentialScope + "\n" + hashcanonicalString;

        byte[] signKey = genSigningSecretKeyV4(sk, shortXDate, service);
        return bytesToHex(hmacSHA256(signKey, signString));
    }

    public static String hashSHA256(byte[] content) throws Exception {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return bytesToHex(md.digest(content));
        } catch (Exception e) {
            throw new Exception("Unable to compute hash while signing request: " + e.getMessage(), e);
        }
    }

    public static byte[] hmacSHA256(byte[] key, String content) throws Exception {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(content.getBytes());
        } catch (Exception e) {
            throw new Exception("Unable to calculate a request signature: " + e.getMessage(), e);
        }
    }

    private static byte[] genSigningSecretKeyV4(String secretKey, String date, String service) throws Exception {
        byte[] kDate = hmacSHA256((secretKey).getBytes(), date);
        byte[] kService = hmacSHA256(kDate, service);
        return hmacSHA256(kService, "request");
    }

    public static String bytesToHex(byte[] bytes) {
        if (bytes == null || bytes.length == 0) {
            return "";
        }
        final StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }

}
API Call Demo Example (Java)

import com.alibaba.fastjson.JSONObject;
import com.alibaba.fastjson.parser.Feature;
import lombok.extern.slf4j.Slf4j;
import org.apache.http.HttpEntity;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Component
public class ApiRequestUtils {
    private static final String API_HOST = "api.vmoscloud.com";
    private static final String CONTENT_TYPE = "application/json;charset=UTF-8";
    private static final String ACCESS_KEY = "Access Key ID";
    private static final String SECRET_ACCESS_KEY = "Secret Access Key";

    /**
     * Test Call
     */
    public static void main(String[] args) {
        //POST request
        JSONObject params = new JSONObject();
        params.put("taskIds", new int[]{4224});
        String url = "https://api.vmoscloud.com/vcpcloud/api/padApi/padTaskDetail";
        String result = sendPostRequest(url, params);
        System.out.println(result);

        //GET request
//        String url = "https://api.vmoscloud.com/vcpcloud/api/padApi/stsToken";
//        String result = sendGetRequest(url, null);
    }

    public static String sendGetRequest(String url, JSONObject params) {
        String xDate = DateToUTC(LocalDateTime.now());
        StringBuilder urlWithParams = new StringBuilder(url);

        // Constructing URL parameters
        if (params != null && !params.isEmpty()) {
            urlWithParams.append("?");
            params.forEach((key, value) ->
                    urlWithParams.append(key).append("=").append(value).append("&")
            );
            // Remove the final "&"
            urlWithParams.setLength(urlWithParams.length() - 1);
        }

        HttpGet httpGet = new HttpGet(urlWithParams.toString());

        // Set public header
        httpGet.setHeader("content-type", CONTENT_TYPE);
        httpGet.setHeader("x-host", API_HOST);
        httpGet.setHeader("x-date", xDate);

        // Generate Authorization Header
        String authorizationHeader = getAuthorizationHeader(xDate, params == null ? null : params.toJSONString(), SECRET_ACCESS_KEY);
        httpGet.setHeader("authorization", authorizationHeader);
        
        try (CloseableHttpClient httpClient = HttpClients.createDefault();
             CloseableHttpResponse response = httpClient.execute(httpGet)) {

            HttpEntity responseEntity = response.getEntity();
            return EntityUtils.toString(responseEntity, StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("Request failed", e);
        }
    }


    /**
     * Public request methods
     */
    public static String sendPostRequest(String url, JSONObject params) {
        String xDate = DateToUTC(LocalDateTime.now());
        HttpPost httpPost = new HttpPost(url);

        // Set public header
        httpPost.setHeader("content-type", CONTENT_TYPE);
        httpPost.setHeader("x-host", API_HOST);
        httpPost.setHeader("x-date", xDate);

        // Generate Authorization Header
        String authorizationHeader = getAuthorizationHeader(xDate, params.toJSONString(), SECRET_ACCESS_KEY);
        httpPost.setHeader("authorization", authorizationHeader);

        // Set the request body
        StringEntity entity = new StringEntity(params.toJSONString(), StandardCharsets.UTF_8);
        httpPost.setEntity(entity);

        // Execute Request
        try (CloseableHttpClient httpClient = HttpClients.createDefault();
             CloseableHttpResponse response = httpClient.execute(httpPost)) {

            HttpEntity responseEntity = response.getEntity();
            return EntityUtils.toString(responseEntity, StandardCharsets.UTF_8);

        } catch (Exception e) {
            throw new RuntimeException("Request failed", e);
        }
    }


    /**
     * Use UTC time, accurate to seconds
     *
     * @param dateTime LocalDateTime
     * @return String
     */
    public static String DateToUTC(LocalDateTime dateTime) {
        // Define date and time format
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("uuuuMMdd'T'HHmmss'Z'");
        return dateTime.format(formatter);
    }


    /**
     * Get Signature
     */
    private static String getSign(String xDate, String sk, String requestBody) throws Exception {
        String body = requestBody == null ? null : JSONObject.parseObject(requestBody, Feature.OrderedField).toJSONString();
        return PaasSignUtils.signature(CONTENT_TYPE, "content-type;host;x-content-sha256;x-date", API_HOST, xDate, sk, body == null ? null : body.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Get the Authorization header
     */
    private static String getAuthorizationHeader(String currentTimestamp, String body, String sk) {
        try {
            String sign = getSign(currentTimestamp, sk, body);
            return String.format("HMAC-SHA256 Credential=%s, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=%s", ACCESS_KEY, sign);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signature", e);
        }
    }

}
Interface call demo example (python)

import binascii
import datetime
import hmac
import hashlib
import json
import traceback

import requests


def get_signature(data, x_date, host, content_type, signed_headers, sk):
    # Given JSON data
    # TODO Convert JSON data to string (Modify the place, the incoming JSON needs to remove spaces)
    json_string = json.dumps(data, separators=(',', ':'), ensure_ascii = False)
    print(json_string)

    # Calculate the SHA-256 hash value
    hash_object = hashlib.sha256(json_string.encode())
    x_content_sha256 = hash_object.hexdigest()

    # Using f-string to build canonicalStringBuilder
    canonical_string_builder = (
        f"host:{host}\n"
        f"x-date:{x_date}\n"
        f"content-type:{content_type}\n"
        f"signedHeaders:{signed_headers}\n"
        f"x-content-sha256:{x_content_sha256}"
    )

    # Assume these variables have been assigned values
    # short_x_date = datetime.datetime.now().strftime("%Y%m%d") # Short request time, for example: "20240101"
    short_x_date = x_date[:8] # Short request time, for example: "20240101"
    service = "armcloud-paas" # Service name

    # Constructing credentialScope
    credential_scope = "{}/{}/request".format(short_x_date, service)

    # Assume these variables have been assigned
    algorithm = "HMAC-SHA256"

    # Calculate the SHA-256 hash of canonicalStringBuilder
    hash_sha256 = hashlib.sha256(canonical_string_builder.encode()).hexdigest()
    # Constructing StringToSign
    string_to_sign = (
            algorithm + '\n' +
            x_date + '\n' +
            credential_scope + '\n' +
            hash_sha256
    )

    # Assume these variables have been assigned values
    service = "armcloud-paas" # Service name

    # First hmacSHA256
    first_hmac = hmac.new(sk.encode(), digestmod=hashlib.sha256)
    first_hmac.update(short_x_date.encode())
    first_hmac_result = first_hmac.digest()

    # Second hmacSHA256
    second_hmac = hmac.new(first_hmac_result, digestmod=hashlib.sha256)
    second_hmac.update(service.encode())
    second_hmac_result = second_hmac.digest()

    # The third hmacSHA256
    signing_key = hmac.new(second_hmac_result, b'request', digestmod=hashlib.sha256).digest()

    # Calculate HMAC-SHA256 using signing_key and string_to_sign
    signature_bytes = hmac.new(signing_key, string_to_sign.encode(), hashlib.sha256).digest()

    # Convert the result of HMAC-SHA256 to a hexadecimal encoded string
    signature = binascii.hexlify(signature_bytes).decode()

    return signature


def paas_url_util(url, data, ak, sk):
    x_date = datetime.datetime.now().strftime("%Y%m%dT%H%M%SZ")
    content_type = "application/json"
    signed_headers = f"content-type;host;x-content-sha256;x-date"
    ShortDate = x_date[:8]
    host = "openapi-hk.armcloud.net"
    # Get signature
    signature = get_signature(data, x_date, host, content_type, signed_headers, sk)
    url = f"http://openapi-hk.armcloud.net{url}"
    payload = json.dumps(data)
    headers = {
        'Content-Type': content_type,
        'x-date': x_date,
        'x-host': host,
        'authorization': f"HMAC-SHA256 Credential={ak}/{ShortDate}/armcloud-paas/request, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature={signature}"
    }
    response = requests.request("POST", url, headers=headers, data=payload)
    return response.json()


def vmos_url_util(url, data, AccessKey, sk):
    x_date = datetime.datetime.now().strftime("%Y%m%dT%H%M%SZ")
    content_type = "application/json;charset=UTF-8"
    signed_headers = f"content-type;host;x-content-sha256;x-date"
    ShortDate = x_date[:8]
    host = "api.vmoscloud.com"

    # Get signature
    signature = get_signature(data, x_date, host, content_type, signed_headers, sk)
    url = f"https://api.vmoscloud.com{url}"

    payload = json.dumps(data, ensure_ascii = False)
    headers = {
        'content-type': "application/json;charset=UTF-8",
        'x-date': x_date,
        'x-host': "api.vmoscloud.com",
        'authorization': f"HMAC-SHA256 Credential={AccessKey}, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature={signature}"
    }
    response = requests.request("POST", url, headers=headers, data=payload)
    return response.json()


#Get instance list information by paging based on query conditions/vcpcloud/api/padApi/infos
pad_infos_url='/vcpcloud/api/padApi/padTaskDetail'
pad_infos_body={"taskIds":[4224]}

#vmos interface call
print(vmos_url_util(pad_infos_url, pad_infos_body, 'Access Key ID','Secret Access Key'))
Signature Generation Utility Class Example（node）

const CryptoJS = require("crypto-js");
const moment = require("moment");

/**
 * Class for generating HMAC-SHA256 signatures for API requests to Vmos cloud services.
 */
class VmosAPISigner {
  constructor(accessKeyId, secretAccessKey) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.contentType = "application/json;charset=UTF-8";
    this.host = "api.vmoscloud.com";
    this.service = "armcloud-paas";
    this.algorithm = "HMAC-SHA256";
  }

  // Generate authentication headers for API requests
  signRequest(requestOptions) {
    const { method, path, queryParams = {}, body = null } = requestOptions;

    // Process request parameters
    let params = "";
    if (method === "POST" && body) {
      params = typeof body === "string" ? body : JSON.stringify(body);
    } else if (method === "GET" && Object.keys(queryParams).length > 0) {
      params = new URLSearchParams(queryParams).toString();
    }

    // Generate timestamp
    const xDate = moment().utc().format("YYYYMMDDTHHmmss[Z]");
    const shortXDate = xDate.substring(0, 8);
    const credentialScope = `${shortXDate}/${this.service}/request`;

    // Build canonical request string
    const canonicalString = [
      `host:${this.host}`,
      `x-date:${xDate}`,
      `content-type:${this.contentType}`,
      `signedHeaders:content-type;host;x-content-sha256;x-date`,
      `x-content-sha256:${CryptoJS.SHA256(params).toString()}`,
    ].join("\n");

    // Calculate signature
    const stringToSign = [
      this.algorithm,
      xDate,
      credentialScope,
      CryptoJS.SHA256(canonicalString).toString(),
    ].join("\n");

    const kDate = CryptoJS.HmacSHA256(shortXDate, this.secretAccessKey);
    const kService = CryptoJS.HmacSHA256(this.service, kDate);
    const signKey = CryptoJS.HmacSHA256("request", kService);

    // Generate final signature
    const sign = CryptoJS.HmacSHA256(stringToSign, signKey);
    const signature = sign.toString(CryptoJS.enc.Hex);

    // Construct authorization header
    const authorization = [
      `HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}`,
      `SignedHeaders=content-type;host;x-content-sha256;x-date`,
      `Signature=${signature}`,
    ].join(", ");

    // Return signed request headers
    return {
      "x-date": xDate,
      "x-host": this.host,
      authorization: authorization,
      "content-type": this.contentType,
    };
  }
}
API Call Demo Example（node）

const CryptoJS = require("crypto-js");
const moment = require("moment");
const axios = require("axios");

axios.interceptors.request.use(
  (config) => {
    // Convert Content-Type header to lowercase
    if (config.headers["Content-Type"]) {
      config.headers["content-type"] = config.headers["Content-Type"];
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => {
    // Handle request errors
    return Promise.reject(error);
  }
);

/**
 * Class for generating HMAC-SHA256 signatures for API requests to Vmos cloud services.
 */
class VmosAPISigner {
  constructor(accessKeyId, secretAccessKey) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.contentType = "application/json;charset=UTF-8";
    this.host = "api.vmoscloud.com";
    this.service = "armcloud-paas";
    this.algorithm = "HMAC-SHA256";
  }

  // Generate authentication headers for API requests
  signRequest(requestOptions) {
    const { method, path, queryParams = {}, body = null } = requestOptions;

    // Process request parameters
    let params = "";
    if (method === "POST" && body) {
      params = typeof body === "string" ? body : JSON.stringify(body);
    } else if (method === "GET" && Object.keys(queryParams).length > 0) {
      params = new URLSearchParams(queryParams).toString();
    }

    // Generate timestamp
    const xDate = moment().utc().format("YYYYMMDDTHHmmss[Z]");
    const shortXDate = xDate.substring(0, 8);
    const credentialScope = `${shortXDate}/${this.service}/request`;

    // Build canonical request string
    const canonicalString = [
      `host:${this.host}`,
      `x-date:${xDate}`,
      `content-type:${this.contentType}`,
      `signedHeaders:content-type;host;x-content-sha256;x-date`,
      `x-content-sha256:${CryptoJS.SHA256(params).toString()}`,
    ].join("\n");

    // Calculate signature
    const stringToSign = [
      this.algorithm,
      xDate,
      credentialScope,
      CryptoJS.SHA256(canonicalString).toString(),
    ].join("\n");

    const kDate = CryptoJS.HmacSHA256(shortXDate, this.secretAccessKey);
    const kService = CryptoJS.HmacSHA256(this.service, kDate);
    const signKey = CryptoJS.HmacSHA256("request", kService);

    // Generate final signature
    const sign = CryptoJS.HmacSHA256(stringToSign, signKey);
    const signature = sign.toString(CryptoJS.enc.Hex);

    // Construct authorization header
    const authorization = [
      `HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}`,
      `SignedHeaders=content-type;host;x-content-sha256;x-date`,
      `Signature=${signature}`,
    ].join(", ");

    // Return signed request headers
    return {
      "x-date": xDate,
      "x-host": this.host,
      authorization: authorization,
      "content-type": this.contentType,
    };
  }
}

// 使用示例
async function makeSignedRequest() {
  const signer = new VmosAPISigner(
    "", // Access Key ID
    "" // Secret Access Key
  );

  const baseURL = "https://api.vmoscloud.com";

  // Example GET request configuration
  const getRequest = {
    method: "GET",
    path: "/vcpcloud/api/padApi/getProxys",
    queryParams: { page: 1, rows: 10 },
  };

  // Example POST request configuration
  const postRequest = {
    method: "POST",
    path: "/vcpcloud/api/padApi/userPadList",
    body: { padCode: "AC32010790572" },
  };

  await axios({
    baseURL: baseURL,
    method: getRequest.method,
    url: getRequest.path,
    headers: signer.signRequest(getRequest),
    params: getRequest.queryParams,
  }).then((response) => {
    console.log("getRequest 响应:", response.data);
  });

  await axios({
    baseURL: baseURL,
    method: postRequest.method,
    url: postRequest.path,
    headers: signer.signRequest(postRequest),
    data: postRequest.body,
  }).then((response) => {
    console.log("postRequest 响应:", response.data);
  });
}

// Run example requests
makeSignedRequest();
Signature Generation Utility Class Example（go）

package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

type VmosAPISigner struct {
	AccessKeyId     string
	SecretAccessKey string
	ContentType     string
	Host            string
	Service         string
	Algorithm       string
}

func NewVmosAPISigner(accessKeyId, secretAccessKey string) *VmosAPISigner {
	return &VmosAPISigner{
		AccessKeyId:     accessKeyId,
		SecretAccessKey: secretAccessKey,
		ContentType:     "application/json;charset=UTF-8",
		Host:            "api.vmoscloud.com",
		Service:         "armcloud-paas",
		Algorithm:       "HMAC-SHA256",
	}
}

func sha256Hex(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func hmacSHA256(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

func (s *VmosAPISigner) SignRequest(method, path string,
	queryParams map[string]string,
	body interface{}) map[string]string {
	var paramStr string
	if method == http.MethodPost && body != nil {
		bodyBytes, _ := json.Marshal(body)
		paramStr = string(bodyBytes)
	} else if method == http.MethodGet && len(queryParams) > 0 {
		var queryParts []string
		for k, v := range queryParams {
			queryParts = append(queryParts, url.QueryEscape(k)+"="+url.QueryEscape(v))
		}
		sort.Strings(queryParts)
		paramStr = strings.Join(queryParts, "&")
	}

	xDate := time.Now().UTC().Format("20060102T150405Z")
	shortDate := xDate[:8]
	credentialScope := fmt.Sprintf("%s/%s/request", shortDate, s.Service)

	// Canonical string
	canonicalString := fmt.Sprintf(
		"host:%s\nx-date:%s\ncontent-type:%s\nsignedHeaders:content-type;host;x-content-sha256;x-date\nx-content-sha256:%s",
		s.Host,
		xDate,
		s.ContentType,
		sha256Hex(paramStr),
	)

	// String to sign
	stringToSign := fmt.Sprintf(
		"%s\n%s\n%s\n%s",
		s.Algorithm,
		xDate,
		credentialScope,
		sha256Hex(canonicalString),
	)

	kDate := hmacSHA256([]byte(s.SecretAccessKey), shortDate)
	kService := hmacSHA256(kDate, s.Service)
	signKey := hmacSHA256(kService, "request")

	signature := hex.EncodeToString(hmacSHA256(signKey, stringToSign))

	authorization := fmt.Sprintf(
		"HMAC-SHA256 Credential=%s/%s, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=%s",
		s.AccessKeyId,
		credentialScope,
		signature,
	)

	return map[string]string{
		"x-date":        xDate,
		"x-host":        s.Host,
		"authorization": authorization,
		"content-type":  s.ContentType,
	}
}
API Call Demo Example（go）

package main

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

type VmosAPISigner struct {
	AccessKeyId     string
	SecretAccessKey string
	ContentType     string
	Host            string
	Service         string
	Algorithm       string
}

func NewVmosAPISigner(accessKeyId, secretAccessKey string) *VmosAPISigner {
	return &VmosAPISigner{
		AccessKeyId:     accessKeyId,
		SecretAccessKey: secretAccessKey,
		ContentType:     "application/json;charset=UTF-8",
		Host:            "api.vmoscloud.com",
		Service:         "armcloud-paas",
		Algorithm:       "HMAC-SHA256",
	}
}

func sha256Hex(data string) string {
	hash := sha256.Sum256([]byte(data))
	return hex.EncodeToString(hash[:])
}

func hmacSHA256(key []byte, data string) []byte {
	h := hmac.New(sha256.New, key)
	h.Write([]byte(data))
	return h.Sum(nil)
}

func (s *VmosAPISigner) SignRequest(method, path string,
	queryParams map[string]string,
	body interface{}) map[string]string {
	var paramStr string
	if method == http.MethodPost && body != nil {
		bodyBytes, _ := json.Marshal(body)
		paramStr = string(bodyBytes)
	} else if method == http.MethodGet && len(queryParams) > 0 {
		var queryParts []string
		for k, v := range queryParams {
			queryParts = append(queryParts, url.QueryEscape(k)+"="+url.QueryEscape(v))
		}
		sort.Strings(queryParts)
		paramStr = strings.Join(queryParts, "&")
	}

	xDate := time.Now().UTC().Format("20060102T150405Z")
	shortDate := xDate[:8]
	credentialScope := fmt.Sprintf("%s/%s/request", shortDate, s.Service)

	// Canonical string
	canonicalString := fmt.Sprintf(
		"host:%s\nx-date:%s\ncontent-type:%s\nsignedHeaders:content-type;host;x-content-sha256;x-date\nx-content-sha256:%s",
		s.Host,
		xDate,
		s.ContentType,
		sha256Hex(paramStr),
	)

	// String to sign
	stringToSign := fmt.Sprintf(
		"%s\n%s\n%s\n%s",
		s.Algorithm,
		xDate,
		credentialScope,
		sha256Hex(canonicalString),
	)

	kDate := hmacSHA256([]byte(s.SecretAccessKey), shortDate)
	kService := hmacSHA256(kDate, s.Service)
	signKey := hmacSHA256(kService, "request")

	signature := hex.EncodeToString(hmacSHA256(signKey, stringToSign))

	authorization := fmt.Sprintf(
		"HMAC-SHA256 Credential=%s/%s, SignedHeaders=content-type;host;x-content-sha256;x-date, Signature=%s",
		s.AccessKeyId,
		credentialScope,
		signature,
	)

	return map[string]string{
		"x-date":        xDate,
		"x-host":        s.Host,
		"authorization": authorization,
		"content-type":  s.ContentType,
	}
}

func sendRequest(method, path string, queryParams map[string]string, body interface{}, signer *VmosAPISigner) {
	baseURL := "https://api.vmoscloud.com"

	// Build URL
	fullURL := baseURL + path
	if method == http.MethodGet && len(queryParams) > 0 {
		values := url.Values{}
		for k, v := range queryParams {
			values.Add(k, v)
		}
		fullURL += "?" + values.Encode()
	}

	// Prepare body
	var bodyReader io.Reader
	if method == http.MethodPost && body != nil {
		bodyBytes, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(bodyBytes)
	}

	// Sign
	headers := signer.SignRequest(method, path, queryParams, body)

	// Create request
	req, err := http.NewRequest(method, fullURL, bodyReader)
	if err != nil {
		fmt.Println("Failed to create request:", err)
		return
	}

	for k, v := range headers {
		req.Header[k] = []string{v}
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Request failed:", err)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("[%s] %s\n", method, string(respBody))
}

func main() {
	signer := NewVmosAPISigner(
		"", // Access Key ID
		"",         // Secret Access Key
	)

	// Example GET request
	getParams := map[string]string{
		"page": "1",
		"rows": "10",
	}
	sendRequest("GET", "/vcpcloud/api/padApi/getProxys", getParams, nil, signer)

	// Example POST request
	postBody := map[string]string{
		"padCode": "AC32010790572",
	}
	sendRequest("POST", "/vcpcloud/api/padApi/userPadList", nil, postBody, signer)
}
Signature Generation Utility Class Example（php）

<?php

class VmosAPISigner
{
  private $accessKeyId;
  private $secretAccessKey;
  private $contentType = "application/json;charset=UTF-8";
  private $host = "api.vmoscloud.com";
  private $service = "armcloud-paas";
  private $algorithm = "HMAC-SHA256";

  // Constructor for VmosAPISigner
  public function __construct($accessKeyId, $secretAccessKey)
  {
    $this->accessKeyId = $accessKeyId;
    $this->secretAccessKey = $secretAccessKey;
  }

  // Generate authentication headers for API requests
  public function signRequest($method, $path, $queryParams = [], $body = null)
  {
    $params = "";
    if (strtoupper($method) === "POST" && $body !== null) {
      $params = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_UNICODE);
    } elseif (strtoupper($method) === "GET" && !empty($queryParams)) {
      $params = http_build_query($queryParams);
    }

    $xDate = gmdate("Ymd\THis\Z");
    $shortXDate = substr($xDate, 0, 8);
    $credentialScope = "$shortXDate/{$this->service}/request";

    $xContentSha256 = hash("sha256", $params);

    $canonicalString = implode("\n", [
      "host:{$this->host}",
      "x-date:$xDate",
      "content-type:{$this->contentType}",
      "signedHeaders:content-type;host;x-content-sha256;x-date",
      "x-content-sha256:$xContentSha256"
    ]);

    $hashedCanonicalString = hash("sha256", $canonicalString);

    $stringToSign = implode("\n", [
      $this->algorithm,
      $xDate,
      $credentialScope,
      $hashedCanonicalString
    ]);

    $kDate = hash_hmac("sha256", $shortXDate, $this->secretAccessKey, true);
    $kService = hash_hmac("sha256", $this->service, $kDate, true);
    $signKey = hash_hmac("sha256", "request", $kService, true);

    $signature = hash_hmac("sha256", $stringToSign, $signKey);

    $authorization = implode(", ", [
      "{$this->algorithm} Credential={$this->accessKeyId}/$credentialScope",
      "SignedHeaders=content-type;host;x-content-sha256;x-date",
      "Signature=$signature"
    ]);

    return [
      "x-date: $xDate",
      "x-host: {$this->host}",
      "authorization: $authorization",
      "content-type: {$this->contentType}"
    ];
  }
}
API Call Demo Example（php）

<?php

class VmosAPISigner
{
  private $accessKeyId;
  private $secretAccessKey;
  private $contentType = "application/json;charset=UTF-8";
  private $host = "api.vmoscloud.com";
  private $service = "armcloud-paas";
  private $algorithm = "HMAC-SHA256";

  // Constructor for VmosAPISigner
  public function __construct($accessKeyId, $secretAccessKey)
  {
    $this->accessKeyId = $accessKeyId;
    $this->secretAccessKey = $secretAccessKey;
  }

  // Generate authentication headers for API requests
  public function signRequest($method, $path, $queryParams = [], $body = null)
  {
    $params = "";
    if (strtoupper($method) === "POST" && $body !== null) {
      $params = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_UNICODE);
    } elseif (strtoupper($method) === "GET" && !empty($queryParams)) {
      $params = http_build_query($queryParams);
    }

    $xDate = gmdate("Ymd\THis\Z");
    $shortXDate = substr($xDate, 0, 8);
    $credentialScope = "$shortXDate/{$this->service}/request";

    $xContentSha256 = hash("sha256", $params);

    $canonicalString = implode("\n", [
      "host:{$this->host}",
      "x-date:$xDate",
      "content-type:{$this->contentType}",
      "signedHeaders:content-type;host;x-content-sha256;x-date",
      "x-content-sha256:$xContentSha256"
    ]);

    $hashedCanonicalString = hash("sha256", $canonicalString);

    $stringToSign = implode("\n", [
      $this->algorithm,
      $xDate,
      $credentialScope,
      $hashedCanonicalString
    ]);

    $kDate = hash_hmac("sha256", $shortXDate, $this->secretAccessKey, true);
    $kService = hash_hmac("sha256", $this->service, $kDate, true);
    $signKey = hash_hmac("sha256", "request", $kService, true);

    $signature = hash_hmac("sha256", $stringToSign, $signKey);

    $authorization = implode(", ", [
      "{$this->algorithm} Credential={$this->accessKeyId}/$credentialScope",
      "SignedHeaders=content-type;host;x-content-sha256;x-date",
      "Signature=$signature"
    ]);

    return [
      "x-date: $xDate",
      "x-host: {$this->host}",
      "authorization: $authorization",
      "content-type: {$this->contentType}"
    ];
  }
}

function makeSignedRequest()
{
  $signer = new VmosAPISigner(
    "",  // Access Key ID
    ""  // Secret Access Key
  );

  $baseURL = "https://api.vmoscloud.com";

  // Example GET request
  $getPath = "/vcpcloud/api/padApi/getProxys";
  $getParams = ["page" => 1, "rows" => 10];
  $getHeaders = $signer->signRequest("GET", $getPath, $getParams);

  $getUrl = $baseURL . $getPath . '?' . http_build_query($getParams);
  $getCurl = curl_init($getUrl);
  curl_setopt($getCurl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($getCurl, CURLOPT_HTTPHEADER, $getHeaders);
  curl_setopt($getCurl, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($getCurl, CURLOPT_SSL_VERIFYHOST, false);

  $getResponse = curl_exec($getCurl);
  curl_close($getCurl);
  echo "GET Response:\n" . $getResponse . "\n";

  // Example POST request
  $postPath = "/vcpcloud/api/padApi/userPadList";
  $postData = ["padCode" => "AC32010790572"];
  $postHeaders = $signer->signRequest("POST", $postPath, [], $postData);

  $postCurl = curl_init($baseURL . $postPath);
  curl_setopt($postCurl, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($postCurl, CURLOPT_POST, true);
  curl_setopt($postCurl, CURLOPT_HTTPHEADER, $postHeaders);
  curl_setopt($postCurl, CURLOPT_POSTFIELDS, json_encode($postData, JSON_UNESCAPED_UNICODE));
  curl_setopt($postCurl, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($postCurl, CURLOPT_SSL_VERIFYHOST, false);

  $postResponse = curl_exec($postCurl);
  if (curl_errno($postCurl)) {
    echo "cURL Error: \n" . curl_error($postCurl) . "\n";
  } else {
    $httpCode = curl_getinfo($postCurl, CURLINFO_HTTP_CODE);
    echo "POST Response HTTP Status: $httpCode\n";
    echo "POST Response:\n$postResponse\n";
  }
  curl_close($postCurl);
}

// Execute the signature request
makeSignedRequest();
Signature Generation Utility Class Example（.net）

using System;
using System.Net.Http;
using System.Text;
using System.Security.Cryptography;
using System.Text.Json;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using System.Security.Cryptography;

public class VmosAPISigner
{
    private readonly string accessKeyId;
    private readonly string secretAccessKey;
    private readonly string contentType = "application/json;charset=utf-8";
    private readonly string host = "api.vmoscloud.com";
    private readonly string service = "armcloud-paas";
    private readonly string algorithm = "HMAC-SHA256";

    public VmosAPISigner(string accessKeyId, string secretAccessKey)
    {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
    }

    public Dictionary<string, string> SignRequest(string method, string path, Dictionary<string, string>? queryParams = null, object? body = null)
    {
        string paramsString = "";

        if (method == "POST" && body != null)
        {
            paramsString = JsonSerializer.Serialize(body);
        }
        else if (method == "GET" && queryParams != null)
        {
            var query = new FormUrlEncodedContent(queryParams).ReadAsStringAsync().Result;
            paramsString = query;
        }

        var utcNow = DateTime.UtcNow;
        var xDate = utcNow.ToString("yyyyMMdd'T'HHmmss'Z'");
        var shortXDate = utcNow.ToString("yyyyMMdd");
        var credentialScope = $"{shortXDate}/{service}/request";

        // Hash body or params
        var payloadHash = SHA256Hex(paramsString);

        // Canonical string
        var canonicalString = string.Join("\n", new[]
                                      {
                                          $"host:{host}",
                                          $"x-date:{xDate}",
                                          $"content-type:{contentType}",
                                          $"signedHeaders:content-type;host;x-content-sha256;x-date",
                                          $"x-content-sha256:{payloadHash}"
                                          });

        // Create string to sign
        var stringToSign = string.Join("\n", new[]
                                   {
                                       algorithm,
                                       xDate,
                                       credentialScope,
                                       SHA256Hex(canonicalString)
                                       });


        // Derive signing key
        var kDate = HmacSHA256(shortXDate, secretAccessKey);

        var kService = HmacSHA256(service, kDate);

        var signKey = HmacSHA256("request", kService);

        var signature = ByteArrayToHex(HmacSHA256(stringToSign, signKey));

        var authorization = string.Join(", ", new[]
                                    {
                                        $"{algorithm} Credential={accessKeyId}/{credentialScope}",
                                        "SignedHeaders=content-type;host;x-content-sha256;x-date",
                                        $"Signature={signature}"
                                        });

        return new Dictionary<string, string>
        {
            { "x-date", xDate },
            { "x-host", host },
            { "authorization", authorization },
            { "content-type", contentType }
        };
    }

    private static string SHA256Hex(string data)
    {
        using var sha256 = SHA256.Create();
        byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }

    private static byte[] HmacSHA256(string data, string key)
    {
        return HmacSHA256(data, Encoding.UTF8.GetBytes(key));
    }

  private static byte[] HmacSHA256(string data, byte[] key)
  {
    using var hmac = new HMACSHA256(key);
    return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
  }

  private static string ByteArrayToHex(byte[] bytes)
  {
    return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
  }
}
API Call Demo Example（.net）
Signer.cs


using System;
using System.Net.Http;
using System.Text;
using System.Security.Cryptography;
using System.Text.Json;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using System.Security.Cryptography;

public class VmosAPISigner
{
    private readonly string accessKeyId;
    private readonly string secretAccessKey;
    private readonly string contentType = "application/json;charset=utf-8";
    private readonly string host = "api.vmoscloud.com";
    private readonly string service = "armcloud-paas";
    private readonly string algorithm = "HMAC-SHA256";

    public VmosAPISigner(string accessKeyId, string secretAccessKey)
    {
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
    }

    public Dictionary<string, string> SignRequest(string method, string path, Dictionary<string, string>? queryParams = null, object? body = null)
    {
        string paramsString = "";

        if (method == "POST" && body != null)
        {
            paramsString = JsonSerializer.Serialize(body);
        }
        else if (method == "GET" && queryParams != null)
        {
            var query = new FormUrlEncodedContent(queryParams).ReadAsStringAsync().Result;
            paramsString = query;
        }

        var utcNow = DateTime.UtcNow;
        var xDate = utcNow.ToString("yyyyMMdd'T'HHmmss'Z'");
        var shortXDate = utcNow.ToString("yyyyMMdd");
        var credentialScope = $"{shortXDate}/{service}/request";

        // Hash body or params
        var payloadHash = SHA256Hex(paramsString);

        // Canonical string
        var canonicalString = string.Join("\n", new[]
                                      {
                                          $"host:{host}",
                                          $"x-date:{xDate}",
                                          $"content-type:{contentType}",
                                          $"signedHeaders:content-type;host;x-content-sha256;x-date",
                                          $"x-content-sha256:{payloadHash}"
                                          });

        // Create string to sign
        var stringToSign = string.Join("\n", new[]
                                   {
                                       algorithm,
                                       xDate,
                                       credentialScope,
                                       SHA256Hex(canonicalString)
                                       });


        // Derive signing key
        var kDate = HmacSHA256(shortXDate, secretAccessKey);

        var kService = HmacSHA256(service, kDate);

        var signKey = HmacSHA256("request", kService);

        var signature = ByteArrayToHex(HmacSHA256(stringToSign, signKey));

        var authorization = string.Join(", ", new[]
                                    {
                                        $"{algorithm} Credential={accessKeyId}/{credentialScope}",
                                        "SignedHeaders=content-type;host;x-content-sha256;x-date",
                                        $"Signature={signature}"
                                        });

        return new Dictionary<string, string>
        {
            { "x-date", xDate },
            { "x-host", host },
            { "authorization", authorization },
            { "content-type", contentType }
        };
    }

    private static string SHA256Hex(string data)
    {
        using var sha256 = SHA256.Create();
        byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
    }

    private static byte[] HmacSHA256(string data, string key)
    {
        return HmacSHA256(data, Encoding.UTF8.GetBytes(key));
    }

  private static byte[] HmacSHA256(string data, byte[] key)
  {
    using var hmac = new HMACSHA256(key);
    return hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
  }

  private static string ByteArrayToHex(byte[] bytes)
  {
    return BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
  }
}
Request.cs


using System.Net.Http;
using System.Threading.Tasks;
using System.Text;
using System.Text.Json;
using System.Net.Http.Headers;

class Program
{
  static async Task Main()
  {
    var signer = new VmosAPISigner(
        "", // Access Key ID
        "" // Secret Access Key
    );

    using var client = new HttpClient { BaseAddress = new Uri("https://api.vmoscloud.com") };

    // Example GET request
    var getPath = "/vcpcloud/api/padApi/getProxys";
    var getParams = new Dictionary<string, string>
    {
        { "page", "1" },
        { "rows", "10" }
    };
    var getHeaders = signer.SignRequest("GET", getPath, getParams);
    var getQuery = new FormUrlEncodedContent(getParams).ReadAsStringAsync().Result;
    var getRequest = new HttpRequestMessage(HttpMethod.Get, $"{getPath}?{getQuery}");
    foreach (var h in getHeaders)
    {
      getRequest.Headers.TryAddWithoutValidation(h.Key, h.Value);
    }
    var getHttpContent = new StringContent("", Encoding.UTF8, "application/json");
    getRequest.Content = getHttpContent;
    var getResponse = await client.SendAsync(getRequest);
    Console.WriteLine("GET Response: " + await getResponse.Content.ReadAsStringAsync() + "\n");

    // Example POST request
    var postPath = "/vcpcloud/api/padApi/userPadList";
    var postBody = new { padCode = "AC32010790572" };
    var postHeaders = signer.SignRequest("POST", postPath, null, postBody);
    var postRequest = new HttpRequestMessage(HttpMethod.Post, postPath);
    foreach (var h in postHeaders) postRequest.Headers.TryAddWithoutValidation(h.Key, h.Value);
    postRequest.Content = new StringContent(JsonSerializer.Serialize(postBody), Encoding.UTF8, "application/json");
    var postResponse = await client.SendAsync(postRequest);
    Console.WriteLine("POST Response: " + await postResponse.Content.ReadAsStringAsync() + "\n");
  }
}
Data encryption and decryption example
Java AES GCM Decryption

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;

public class AESUtils {
    private static final String AES = "AES";
    private static final String AES_CIPHER_ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 16;
    private static final int GCM_IV_LENGTH = 12;

    /**
     * Generates a SecretKeySpec from a given string key
     */
    private static SecretKeySpec getKeyFromPassword(String password) throws NoSuchAlgorithmException {
        MessageDigest sha = MessageDigest.getInstance("SHA-256");
        byte[] key = sha.digest(password.getBytes());
        return new SecretKeySpec(key, AES);
    }

    /**
     * Generates a new Initialization Vector (IV)
     */
    public static byte[] generateIv() {
        byte[] iv = new byte[GCM_IV_LENGTH];
        new SecureRandom().nextBytes(iv);
        return iv;
    }

    /**
     * Encrypts a plain text using AES algorithm and returns both the cipher text and IV
     */
    public static String encrypt(String input, String key) {
        try {
            SecretKeySpec secretKeySpec = getKeyFromPassword(key);
            byte[] iv = generateIv();
            Cipher cipher = Cipher.getInstance(AES_CIPHER_ALGORITHM);
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKeySpec, gcmParameterSpec);
            byte[] cipherText = cipher.doFinal(input.getBytes());

            // Encode IV and cipher text to Base64 and concatenate them with a separator
            String ivString = Base64.getEncoder().encodeToString(iv);
            String cipherTextString = Base64.getEncoder().encodeToString(cipherText);
            return ivString + ":" + cipherTextString;
        } catch (Exception e) {
            log.error("encrypt error >>>input:{} key:{}", input, key, e);
            return null;
        }

    }

    /**
     * Decrypts an encrypted text using AES algorithm
     */
    public static String decrypt(String encryptedData, String key) {
        try {
            SecretKeySpec secretKeySpec = getKeyFromPassword(key);

            // Split the encrypted data into IV and cipher text
            String[] parts = encryptedData.split(":");
            String ivString = parts[0];
            String cipherTextString = parts[1];

            byte[] iv = Base64.getDecoder().decode(ivString);
            byte[] cipherText = Base64.getDecoder().decode(cipherTextString);

            Cipher cipher = Cipher.getInstance(AES_CIPHER_ALGORITHM);
            GCMParameterSpec gcmParameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH * 8, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKeySpec, gcmParameterSpec);
            byte[] plainText = cipher.doFinal(cipherText);
            return new String(plainText);
        } catch (Exception e) {
            log.error("decrypt error >>>encryptedData:{} key:{}", encryptedData, key, e);
            return null;
        }

    }

    /**
     * Encodes the input byte array to a Base64 string
     */
    public static String encodeToString(byte[] input) {
        return Base64.getEncoder().encodeToString(input);
    }

    // Encodes the input string to a Base64 string
    public static String encodeToString(String input) {
        return Base64.getEncoder().encodeToString(input.getBytes());
    }

    /**
     * Decodes the input Base64 string to a byte array
     */
    public static byte[] decodeToBytes(String input) {
        return Base64.getDecoder().decode(input);
    }

    /**
     * Decodes the input Base64 string to a regular string
     */
    public static String decodeToString(String input) {
        byte[] decodedBytes = Base64.getDecoder().decode(input);
        return new String(decodedBytes);
    }

    /**
     * Encodes the input byte array to a Base64 byte array
     */
    public static byte[] encodeToBytes(byte[] input) {
        return Base64.getEncoder().encode(input);
    }

    /**
     * Decodes the input Base64 byte array to a byte array
     */
    public static byte[] decodeToBytes(byte[] input) {
        return Base64.getDecoder().decode(input);
    }

    public static void main(String[] args) throws Exception {
        String key = "AC22030010001"; // 任意字符串作为密钥
        // Decrypt the cipher text
        String decryptedText = decrypt("iMzQUI7SwzSD0kGJ:4FZ1fn1Jdd5Z4j2ehn/F3VSUVWBwLFQZH/HOCjLAI95r", key);
        System.out.println("Decrypted text: " + decryptedText);
    }
}

API Overview
Instance Management
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/restart	Instance Restart	Restart a specified instance to resolve issues like system unresponsiveness or freezes.
/vcpcloud/api/padApi/reset	Instance Reset	Reset a specified instance.
/vcpcloud/api/padApi/padProperties	Query Instance Properties	Query the properties of a specified instance.
/vcpcloud/api/padApi/batchPadProperties	Batch Query Instance Properties	Batch query the properties of specified instances, including system properties and configuration settings.
/vcpcloud/api/padApi/updatePadProperties	Modify Instance Properties	Dynamically modify the properties of an instance, including system properties and settings.
/vcpcloud/api/padApi/dissolveRoom	Stop Stream	Stop streaming on a specified instance.
/vcpcloud/api/padApi/updatePadAndroidProp	Modify Instance Android Device Properties	Modify the Android modification properties of an instance.
/vcpcloud/api/padApi/setProxy	Set Proxy for Instance	Set proxy information for a specified instance.
/vcpcloud/api/padApi/replacePad	One-Click New Device	Replace the instance with a new machine in one click.
/vcpcloud/api/padApi/templateList	Get real machine templates by page	Get real machine templates by page
/vcpcloud/api/padApi/country	Query the list of countries supported by one-click new machines	Query the list of countries supported by one-click new machines
/vcpcloud/api/padApi/replacement	Switch Device	Switch Device.
/vcpcloud/api/padApi/setWifiList	修改实例wifi属性	修改实例wifi属性
Instance Operations
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/asyncCmd	Execute Async ADB Command	Execute adb commands in one or more cloud phone instances (asynchronous task).
/vcpcloud/api/padApi/syncCmd	Synchronously Execute ADB Commands	Execute adb commands in one or more cloud phone instances (synchronous task).
/vcpcloud/api/padApi/generatePreview	Generate Preview Image	Take a screenshot of the current cloud phone screen and get the download link for the screenshot.
/vcpcloud/api/padApi/openOnlineAdb	Enable or disable ADB	Open or close instance adb according to instance number
/vcpcloud/api/padApi/adb	Get ADB connection information	Get adb connection information based on the instance number. If the response data (key, adb) is incomplete, call Enable/Disable ADB to enable adb.
/vcpcloud/api/padApi/updateContacts	Modify Contacts	Modify the contacts list.
/vcpcloud/api/padApi/updateTimeZone	Modify Instance Time Zone	Modify the time zone of the instance.
/vcpcloud/api/padApi/updateLanguage	Modify Instance Language	Modify the language of the instance.
/vcpcloud/api/padApi/updateSIM	Modify Instance SIM Card Info	Modify the SIM card information of the instance.
/vcpcloud/api/padApi/gpsInjectInfo	Set Instance Latitude/Longitude	Set the latitude and longitude of the instance.
/vcpcloud/api/padApi/screenshot	Local Screenshot	Take a local screenshot.
/vcpcloud/api/padApi/upgradeImage	Upgrade Image	Upgrade the image of the instance.
/vcpcloud/api/padApi/virtualRealSwitch	Upgrade Physical Machine Image	Upgrade the physical machine image of the instance.
/vcpcloud/api/padApi/checkIP	Smart IP Proxy Check	Check the smart IP proxy.
/vcpcloud/api/padApi/smartIp	Set Smart IP	Set the smart IP.
/vcpcloud/api/padApi/notSmartIp	Cancel Intelligent IP	Cancel the intelligent IP setting.
/vcpcloud/api/padApi/getTaskStatus	Equipment task execution result query.	Equipment task execution result query.
/vcpcloud/api/padApi/switchRoot	Modify instance wifi attributes	Modify instance wifi attributes
Resource Management
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/infos	Instance List Information	Query information about all ordered instances.
Application Management
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/installApp	Application Installation	Install and deploy a specified application to the specified cloud instance (asynchronous task).
/vcpcloud/api/padApi/startApp	Start App	Start App
/vcpcloud/api/padApi/stopApp	Stop App	Stop App
/vcpcloud/api/padApi/restartApp	Restart App	Restart App
/vcpcloud/api/padApi/listInstalledApp	Instance installed application list query	Query the list of installed applications for an instance
/vcpcloud/api/padApi/updateSIM	Modify sim card information according to country code	Modify sim card information according to country code
/vcpcloud/api/padApi/uploadFileV3	File upload interface directly through link	File upload interface directly through link
/vcpcloud/api/padApi/setKeepAliveApp	Set keepalive application interface	Set keepalive application interface
/vcpcloud/api/padApi/addUserRom	Upload user image	Upload user image
Task Management
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/padTaskDetail	Instance Operation Task Details	Query detailed execution results of a specified instance operation task.
/vcpcloud/api/padApi/fileTaskDetail	File Task Details	Query detailed execution results of a specified file task.
Cloud Phone Management
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/createMoneyOrder	Create Cloud Phone	Create a new cloud phone instance.
/vcpcloud/api/padApi/userPadList	Cloud Phone List	List of cloud phones.
/vcpcloud/api/padApi/padInfo	Cloud Phone Information Query	Query the information of a cloud phone instance.
/vcpcloud/api/padApi/getCloudGoodList	SKU Package List	List of SKU packages.
/vcpcloud/api/padApi/replaceRealAdiTemplate	Modify Real Machine ADI Template	Modify the ADI template of a physical machine.
/vcpcloud/api/padApi/createMoneyProOrder	Equipment Pre-sale Purchase	Equipment Pre-sale Purchase
/vcpcloud/api/padApi/queryProOrderList	Query pre-sale order result details	Query pre-sale order result details
/vcpcloud/api/padApi/imageVersionList	Android image version collection	Android image version collection
/vcpcloud/api/padApi/simulateTouch	Cloud machine simulated touch	Cloud machine simulated touch
TK Automation
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/autoTaskList	Automated Task List Query	Query the list of automated tasks.
/vcpcloud/api/padApi/addAutoTask	Create Automation Task	Create a new automated task.
/vcpcloud/api/padApi/reExecutionAutoTask	Automated Task Retry	Retry an automated task.
/vcpcloud/api/padApi/cancelAutoTask	Automated Task Cancellationlation	Cancel an automated task.
SDK Token
API Endpoint	API Name	API Description
/vcpcloud/api/padApi/stsToken	Get SDK Temporary Token	Issue a temporary SDK token for user authentication of cloud phone services.
/vcpcloud/api/padApi/stsTokenByPadCode	Get SDK Temporary Token	Issue a temporary SDK token for user authentication of cloud phone services, based on pad code.
/vcpcloud/api/padApi/clearStsToken	Clear SDK Authorization Token	Clear the SDK authorization token.
OpenAPI Interface List
Instance Management
Modify instance wifi attributes
Modify the wifi list properties of the specified instance (either this interface or setting up wifi on a new machine, otherwise there will be coverage issues).

Interface address

/vcpcloud/api/padApi/setWifiList

Request method

POST

Request data type

application/json

Request Body parameters

Parameter name	Example value	Parameter type	Required or not	Parameter description
padCodes		String[]	Yes	
├─	AC21020010001	String	Yes	Instance number
wifiJsonList		String[]	Yes	wifi attribute list
├─ ssid	110101	String	Yes	wifi name
├─ BSSID	02:31:00:00:00:01	String	Yes	Access point mac address
├─ MAC	02:00:10:00:00:00	String	Yes	wifi network card mac address
├─ IP	02:00:10:00:00:00	String	Yes	wifi network IP
├─ MAC	02:00:10:00:00:00	String	Yes	wifi network + mac address
├─ gateway	192.168.1.20	String	Yes	wifi gateway
├─ DNS1	1.1.1.1	String	Yes	DNS1
├─ DNS2	8.8.8.8	String	Yes	DNS2
├─ hessid	0	Integer	No	network identifier
├─ anqpDomainId	0	Integer	No	ANQP (Access Network Query Protocol) domain ID
├─ capabilities	""	String	No	WPA/WPA2 and other information
├─ level	0	Integer	No	Signal strength (RSSI)
├─ linkSpeed ​​	500	Integer	No	Current Wi-Fi connection speed
├─ txLinkSpeed ​​	600	Integer	No	Upload link speed
├─ rxLinkSpeed ​​	700	Integer	No	Download link speed
├─ frequency	2134	Integer	No	Wi-Fi channel frequency
├─ distance	-1	Integer	No	Estimated AP distance
├─ distanceSd	-1	Integer	No	Standard deviation of estimated distance
├─ channelWidth	0	Integer	No	Channel width
├─ centerfreq0	0	Integer	No	Center frequency 0
├─ centerfreq1	-1	Integer	No	Center frequency 1
├─ is80211McRTTResponder	false	Boolean	No	Whether to support 802.11mc (Wi-Fi RTT, ranging technology)
Response parameters

Parameter name	Example value	Parameter type	Parameter description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─taskId	1	Integer	Task ID
├─padCode	AC21020010001	String	Instance number
├─vmStatus	1	Integer	Instance online status (0: offline; 1: online)
Request example


{
    "padCodes":["AC2025030770R92X"],
        "wifiJsonList":[{
        "ssid": "110101",
        "bssid": "02:31:00:00:00:01",
        "mac": "02:00:10:00:00:00",
        "ip": "192.168.120.15",
        "gateway": "192.168.120.1",
        "dns1": "1.1.1.1",
        "dns2": "8.8.8.8",
        "hessid": 0,
        "anqpDomainId": 0,
        "capabilities": "",
        "level": 0,
        "linkSpeed": 500,
        "txLinkSpeed": 600,
        "rxLinkSpeed": 700,
        "frequency": 2413,
        "distance": -1,
        "distanceSd": -1,
        "channelWidth": 0,
        "centerFreq0": -1,
        "centerFreq1": -1,
        "is80211McRTTResponder": true
    }]
}
Response Example


{
    "code": 200,
    "msg": "success",
    "ts":1713773577581,
    "data":[{
        "taskId": 1,
        "padCode": "AC21020010001",
        "vmStatus": 1
    }]
}
Instance Restart
Perform a restart on the specified instance to resolve system unresponsiveness, lag, and other issues. A new feature has been added to support changing the device's network IP after the restart.

API Endpoint

/vcpcloud/api/padApi/restart

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Type	Required	Description
padCodes		String[]	Yes	
├─	AC21020010001	String	Yes	Instance ID
groupIds		Integer[]	No	
├─	1	Integer	No	Instance Group ID
changeIpFlag	false	Boolean	No	Is it necessary to change the network IP? True - Yes, False - No. Default - False.
Response Parameters

Parameter Name	Example Value	Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─ taskId	1	Integer	Task ID
├─ padCode	AC21020010001	String	Instance ID
├─ vmStatus	1	Integer	Instance online status (0: Offline; 1: Online)
Request Example


{
    "padCodes": [
        "AC22030022693"
    ],
    "changeIpFlag": false,
    "groupIds": [1]
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts":1713773577581,
	"data":[
        {
        "taskId": 1,
        "padCode": "AC21020010001",
        "vmStatus": 1
        }
    ]
}
Error Codes

Error Code	Error Description	Suggested Action
10001	Restart failed	Contact administrator
110004	Failed to execute restart command	Retry restart later
110028	Instance does not exist	Check if the instance exists
Instance Reset
Performs a reset operation on the specified instance to clear applications and files.

API Endpoint

/vcpcloud/api/padApi/reset

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	
├─	AC21020010001	String	Yes	Instance ID
groupIds		Integer[]	No	
├─	1	Integer	No	Instance Group ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─ taskId	1	Integer	Task ID
├─ padCode	AC21020010001	String	Instance ID
├─ vmStatus	1	Integer	Instance Online Status (0: Offline; 1: Online)
Request Example


{
	"padCodes": ["AC21020010001"],
	"groupIds": [1]
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717559681604,
	"data": [
		{
			"taskId": 88,
			"padCode": "AC22030010001",
			"vmStatus": 1
		},
		{
			"taskId": 89,
			"padCode": "AC22030010002",
			"vmStatus": 0
		}
	]
}
Error Codes

Error Code	Error Description	Suggested Action
10002	Reset failed	Contact administrator
110005	Failed to execute reset command	Retry reset later
Query Instance Properties
Query the properties of a specified instance, including system property information and settings.

API Endpoint

/vcpcloud/api/padApi/padProperties

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Type	Required	Description
padCode	AC21020010001	String	Yes	Instance code
Response Parameters

Parameter Name	Example Value	Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object	
├─ padCode	AC21020010001	String	Instance code
├─ modemPropertiesList		Object[]	Modem properties list
├─ ├─ propertiesName	IMEI	String	Property name
├─ ├─ propertiesValue	412327621057784	String	Property value
├─ systemPropertiesList		Object[]	System properties list
├─ ├─ propertiesName	ro.build.id	String	Property name
├─ ├─ propertiesValue	QQ3A.200805.001	String	Property value
├─ settingPropertiesList		Object[]	Setting properties list
├─ ├─ propertiesName	ro.build.tags	String	Property name
├─ ├─ propertiesValue	release-keys	String	Property value
├─ oaidPropertiesList		Object[]	Oaid properties list
├─ ├─ propertiesName	oaid	String	Property name
├─ ├─ propertiesValue	001	String	Property value
Request Example


{
	"padCode": "AC21020010001"
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts":1713773577581,
	"data": {
		"padCode": "AC21020010001",
		"modemPropertiesList": [
			{
				"propertiesName": "IMEI",
				"propertiesValue": "412327621057784"
			}
		],
		"systemPropertiesList": [
			{
				"propertiesName": "ro.build.id",
				"propertiesValue": "QQ3A.200805.001"
			}
		],
		"settingPropertiesList": [
			{
				"propertiesName": "ro.build.tags",
				"propertiesValue": "release-keys"
			}
		],
		"oaidPropertiesList": [
			{
				"propertiesName": "oaid",
				"propertiesValue": "001"
			}
		]
	}
}
Error Codes

Error Code	Error Description	Suggested Action
110028	Instance not found	Please check if the instance is correct
Batch Query Instance Properties
Batch query the property information of specified instances, including system properties and settings.

API Endpoint

/vcpcloud/api/padApi/batchPadProperties

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes	["AC21020010001"]	String[]	Yes	
├─	AC21020010001	String	Yes	Instance Code
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
ts	1756021167163	Long	Timestamp
data	Object[]		
├─ padCode	AC21020010001	String	Instance Code
├─ modemPropertiesList	Object[]		Modem Properties List
├─ ├─ propertiesName	IMEI	String	Property Name
├─ ├─ propertiesValue	412327621057784	String	Property Value
├─ systemPropertiesList	Object[]		System Properties List
├─ ├─ propertiesName	ro.build.id	String	Property Name
├─ ├─ propertiesValue	QQ3A.200805.001	String	Property Value
├─ settingPropertiesList	Object[]		Setting Properties List
├─ ├─ propertiesName	ro.build.tags	String	Property Name
├─ ├─ propertiesValue	release-keys	String	Property Value
├─ oaidPropertiesList	Object[]		Oaid Properties List
├─ ├─ propertiesName	oaid	String	Property Name
├─ ├─ propertiesValue	001	String	Property Value
Request Example


{
    "padCodes": [
        "AC21020010001",
        "AC21020010002"
    ]
}

Response Example


{
    "code": 200,
        "msg": "success",
        "ts":1713773577581,
        "data": [
        {
            "padCode": "AC21020010001",
            "modemPropertiesList": [
                {
                    "propertiesName": "IMEI",
                    "propertiesValue": "412327621057784"
                }
            ],
            "systemPropertiesList": [
                {
                    "propertiesName": "ro.build.id",
                    "propertiesValue": "QQ3A.200805.001"
                }
            ],
            "settingPropertiesList": [
                {
                    "propertiesName": "ro.build.tags",
                    "propertiesValue": "release-keys"
                }
            ],
            "oaidPropertiesList": [
                {
                    "propertiesName": "oaid",
                    "propertiesValue": "001"
                }
            ]
        },
        {
            "padCode": "AC21020010002",
            "modemPropertiesList": [
                {
                    "propertiesName": "IMEI",
                    "propertiesValue": "412327621057784"
                }
            ],
            "systemPropertiesList": [
                {
                    "propertiesName": "ro.build.id",
                    "propertiesValue": "QQ3A.200805.001"
                }
            ],
            "settingPropertiesList": [
                {
                    "propertiesName": "ro.build.tags",
                    "propertiesValue": "release-keys"
                }
            ],
            "oaidPropertiesList": [
                {
                    "propertiesName": "oaid",
                    "propertiesValue": "001"
                }
            ]
        }
    ]
}
Error Codes

Error Code	Error Description	Suggested Action
110028	Instance does not exist	Please check if the instance is correct
Modify Instance Properties
Dynamically modify the properties of an instance, including system properties and settings.

The instance needs to be powered on, and this interface takes effect immediately.

API Endpoint

/vcpcloud/api/padApi/updatePadProperties

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	
├─	AC21020010001	String	Yes	Instance Code
modemPropertiesList		Object[]	No	Modem-Property List
├─propertiesName	IMEI	String	Yes	Property Name
├─propertiesValue	412327621057784	String	Yes	Property Value
systemPropertiesList		Object[]	No	System-Property List
├─propertiesName	ro.build.id	String	Yes	Property Name
├─propertiesValue	QQ3A.200805.001	String	Yes	Property Value
settingPropertiesList		Object[]	No	Setting-Property List
├─propertiesName	ro.build.tags	String	Yes	Property Name
├─propertiesValue	release-keys	String	Yes	Property Value
oaidPropertiesList		Object[]	No	Oaid-Property List
├─propertiesName	oaid	String	Yes	Property Name
├─propertiesValue	001	String	Yes	Property Value
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─taskId	1	Integer	Task ID
├─padCode	AC21020010001	String	Instance Code
├─vmStatus		Integer	Instance online status (0: Offline, 1: Online)
Request Example


{
    "padCodes": [
        "AC21020010001"
    ],
        "modemPersistPropertiesList": [
        {
            "propertiesName": "IMEI",
            "propertiesValue": "412327621057784"
        }
    ],
        "modemPropertiesList": [
        {
            "propertiesName": "IMEI",
            "propertiesValue": "412327621057784"
        }
    ],
        "systemPersistPropertiesList": [
        {
            "propertiesName": "ro.build.id",
            "propertiesValue": "QQ3A.200805.001"
        }
    ],
        "systemPropertiesList": [
        {
            "propertiesName": "ro.build.id",
            "propertiesValue": "QQ3A.200805.001"
        }
    ],
        "settingPropertiesList": [
        {
            "propertiesName": "ro.build.tags",
            "propertiesValue": "release-keys"
        }
    ],
        "oaidPropertiesList": [
        {
            "propertiesName": "oaid",
            "propertiesValue": "001"
        }
    ]
}
Response Example


{
    "code": 200,
        "msg": "success",
        "ts": 1717570916196,
        "data": [
        {
            "taskId": 36,
            "padCode": "AC22030010001",
            "vmStatus": 1
        }
    ]
}

Error Codes

Error Code	Error Description	Recommended Action
110028	Instance does not exist	Please check if the instance is correct
Stop Stream
Stop the stream of the specified instance and disconnect the instance.

API Endpoint

/vcpcloud/api/padApi/dissolveRoom

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	
├─	AC11010000031	String	Yes	Instance ID
├─	AC22020020700	String	Yes	Instance ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─ successList		Object[]	Successful List
├─ ├─ padCode	AC11010000031	String	Instance ID
├─ failList		Object[]	Failure List
├─ ├─ padCode	AC22020020700	String	Instance ID
├─ ├─ errorCode	120005	Integer	Error Code
├─ ├─ errorMsg	Instance does not exist	String	Failure Reason
Request Example


{
    "padCodes": ["AC11010000031","AC22020020700"]
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts":1713773577581,
     "data": {
	 	  "successList": [
              {
                  "padCode": "AC11010000031"
              }
          ],
          "failList": [
		  	 {
                  "padCode": "AC22020020700",
				  "errorCode": 120005,
				  "errorMsg": "Instance does not exist"
              }
		  ]
     }
}
Error Codes

Error Code	Error Description	Suggested Action
120005	Instance does not exist	Please check if the instance ID is correct
120004	Stream stop error, command service exception	Please try again later
Modify Instance Android Device Properties
Description of the props field: This field is defined as key-value pairs.

API URL

/vcpcloud/api/padApi/updatePadAndroidProp

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCode	AC32010210001	String	Yes	Instance ID
restart	false	Boolean	No	Automatically restart after setting (default: false)
props	{}	Object	Yes	System properties
├─ ro.product.vendor.name	OP52D1L1	String	Yes	System property
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─ taskId	24	Long	Task ID
├─ padCode	AC32010210001	String	Instance ID
Request Example


{
	"padCode": "AC32010210001",
	"props": {
		"ro.product.vendor.name": "OP52D1L1"
	},
	"restart": false
}

Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1730192434383,
	"data": {
		"taskId": 11,
		"padCode": "AC32010210001"
	}
}
Instance Control
Asynchronous Execution of ADB Commands
Asynchronously execute commands on one or more cloud phone instances.

API URL

/vcpcloud/api/padApi/asyncCmd

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	Instance IDs
├─	AC22020020793	String	Yes	Instance ID
scriptContent	cd /root;ls	String	Yes	ADB command, separate multiple commands with a semicolon
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─ taskId	1	Integer	Task ID
├─ padCode	AC22020020793	String	Instance ID
├─ vmStatus	1	Integer	Instance status (0: offline; 1: online)
Request Example


{
    "padCodes": [
        "AC22020020793"
    ],
    "scriptContent": "cd /root;ls"
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570297639,
	"data": [
		{
			"taskId": 14,
			"padCode": "AC22030010001",
			"vmStatus": 1
		},
		{
			"taskId": 15,
			"padCode": "AC22030010002",
			"vmStatus": 0
		}
	]
}
Error Codes

Error Code	Error Description	Recommended Action
110003	ADB command execution failed	Contact the administrator
110012	Command execution timed out	Please try again later
Synchronously Execute ADB Commands
Execute commands synchronously on one or more cloud phone instances.

Returns a timeout exception if there is no response after 5 seconds.

API URL

/vcpcloud/api/padApi/syncCmd

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCode	AC22020020793	String	Yes	Instance ID
scriptContent	cd /root;ls	String	Yes	ADB command, multiple commands separated by semicolons
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─taskId	1	Integer	Task ID
├─padCode	AC22020020793	String	Instance ID
├─taskStatus	3	Integer	Task status (-1: all failed; -2: partially failed; -3: canceled; -4: timeout; 1: pending execution; 2: executing; 3: completed)
├─taskResult	Success	String	Task result
Request Example


{
    "padCode": "VP21020010231",
    "scriptContent": "cd /root/nbin;ls"
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts":1713773577581,
	"data":[
				{
				"taskId": 1,
				"padCode": "AC22020020793",
				"taskStatus":3,
				"taskResult":"Success"
				}
			]
}
Error Codes

Error Code	Error Description	Recommended Action
110003	ADB command execution failed	Please try again later
110012	Command execution timeout	Please try again later
Generate Preview Image
Generate a preview image for the specified instance.

API Endpoint

/vcpcloud/api/padApi/generatePreview

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	
├─	AC11010000031	String	Yes	Instance ID
rotation	0	Integer	Yes	Screenshot orientation: 0 - No rotation (default); 1 - Rotate to portrait for landscape screenshot
broadcast	false	Boolean	No	Whether the event is broadcasted (default is false)
Response Parameters

Parameter	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─padCode	AC11010000031	String	Instance ID
├─accessUrl	http://xxx.armcloud.png	String	Access URL for the preview image
Request Example


{
    "padCodes": [
        "AC11010000031"
    ],
    "rotation": 0,
    "broadcast": false
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts":1713773577581,
	"data": [
		{
			"padCode": "AC11010000031",
			"accessUrl": "http://xxx.armcloud.png"
		}
	]
}
Enable or disable ADB
Open or close instance adb according to instance number.

API Endpoint

/vcpcloud/api/padApi/openOnlineAdb

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	Instance list (input instance quantity 1-200)
├─padCode	AC32010140011	String	Yes	Instance number
openStatus	true	boolean	Yes	Enable or disable ADB status (1 to enable, 0 or not to enable by default)
Response Parameters

Parameter	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─taskId	16147	Integer	task id
├─padCode	AC32010250032	String	Instance number
├─taskStatus	3	Integer	Task status (-1 all failed, -2 part failed, -3 canceled, -4 timed out, -5 abnormal, 1 waiting for execution, 2 executing, 3 completed)
├─taskResult	success	String	Task results
Request Example


{
    "padCodes":[
        "AC32010250032"
    ],
    "status": 1
}
Response Example


{
    "code": 200,
    "msg": "success",
    "ts": 1736920929306,
    "data": [
        {
            "taskId": 16147,
            "padCode": "AC32010250032",
            "taskStatus": 3,
            "taskResult": "success"
        }
    ]
}
Get ADB connection information
Get adb connection information based on the instance number. If the response data (key, adb) is incomplete, call Enable/Disable ADB to enable adb.

API Endpoint

/vcpcloud/api/padApi/adb

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter	Example Value	Parameter Type	Required	Description
padCodes	AC22030010124	String	Yes	Instance ID
enable	true	boolean	Yes	true - Open, false - Close
Response Parameters

Parameter	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─padCode	AC32010140011	String	Instance ID
├─command	adb connect ip:port	Integer	ADB connection info
├─expireTime	2024-10-24 10:42:00	String	Connection expiration time
├─enable	true	boolean	ADB status
Request Example


{
  "padCode": "AC22030010001",
  "enable": true
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1729651701083,
	"data": {
		"padCode": "AC32010161274",
		"command": "adb connect ip:port",
		"expireTime": "2024-10-24 10:42:00",
		"enable": true
	}
}
Update Contacts
Either fileUniqueId or info is required.

API Endpoint

/vcpcloud/api/padApi/updateContacts

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter	Example Value	Parameter Type	Required	Description
padCodes	[]	Array	Yes	List of instance IDs
fileUniqueId	cfca25a2c62b00e065b417491b0cf07ffc	String	No	Contact file ID
info		Object[]	No	Contact information
├─firstName	tom	String	No	First name
├─phone	13111111111	String	No	Phone number
├─email	tom@gmail.com	String	No	Email address
Response Parameters

Parameter	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─taskId	11	Integer	Task ID
├─padCode	AC32010210001	String	Instance ID
├─vmStatus	0	Integer	Instance online status (0: offline; 1: online)
Request Example


{
  "fileUniqueId": "cfca25a2c62b00e065b417491b0cf07ffc",
  "info": [{
    "firstName": "tom",
    "phone": "13111111111",
    "email": "tom@gmail.com"
  }],
  "padCodes": [
    "AC32010180326"
  ]
}
Response Example


{
  "code": 200,
  "msg": "success",
  "ts": 1730192434383,
  "data": [{
    "taskId": 11,
    "padCode": "AC32010210001",
    "vmStatus": 0
  }]
}
Set Proxy for Instance
API Endpoint

/vcpcloud/api/padApi/setProxy

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter	Example Value	Parameter Type	Required	Description
account	2222	String	No	Account
password	2222	String	No	Password
ip	47.76.241.5	String	No	IP
port	2222	Integer	No	Port
enable	true	Boolean	Yes	Enable
padCodes	[]	Array	Yes	List of instances
proxyType	vpn	String	No	Supported values: proxy, vpn
proxyName	socks5	String	No	Supported values: socks5, http-relay (http, https)
bypassPackageList		Array	No	Package names that will bypass the proxy
bypassIpList		Array	No	IPs that will bypass the proxy
bypassDomainList		Array	No	Domains that will bypass the proxy
Response Parameters

Parameter	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─taskId	24	Long	Task ID
├─padCode	AC22030010001	String	Instance ID
├─vmStatus	0	Integer	Instance online status (0: offline; 1: online)
Request Example


{
  "padCodes": [
    "AC32010140023"
  ],
  "account": "2222",
  "password": "2222",
  "ip": "47.76.241.5",
  "port": 2222,
  "enable": true
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570663080,
	"data": [
		{
			"taskId": 24,
			"padCode": "AC32010140023",
			"vmStatus": 1
		}
	]
}
Get real machine templates by page
Get real machine templates by page

Interface address

/vcpcloud/api/padApi/templateList

Request method

POST

Request data type

application/json

Request Body parameters

Parameter name	Example value	Parameter type	Required	Parameter description
page	1	Integer	Yes	Page number
rows	10	Integer	Yes	Number of records per page
Response parameters

Parameter name	Example value	Parameter type	Parameter description
msg	success	String	Response message
code	200	Integer	Status code
ts	1736327056700	Long	Timestamp
data		Object	Data details
├─ records		Object[]	Record list
│ ├─ goodFingerprintId	127	Integer	Cloud device template ID
│ ├─ goodFingerprintName	Samsung Galaxy Note 20	String	Cloud device name
│ ├─ goodAndroidVersion	13	String	Android version
├─ total	25	Integer	Total number of records
├─ size	10	Integer	Number of records per page
├─ current	1	Integer	Current page number
├─ pages	3	Integer	Total number of pages
Request example


{
"page": 1,
"rows": 10
}
Response example


{
    "msg": "success",
    "code": 200,
     "data": {
         "records": [
         {
             "goodFingerprintId": 127,
             "goodFingerprintName": "Samsung Galaxy Note 20",
             "goodAndroidVersion": "13",
         }
         ],
         "total": 25,
         "size": 10,
         "current": 1,
         "pages": 3
     },
     "ts": 1742454918332
}
One-Click New Device ⭐️
Interface URL

/vcpcloud/api/padApi/replacePad

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCodes	[]	Array	Yes	Instance list
countryCode	SG	String	No	Country code (for details, please refer to: https://chahuo.com/country-code-lookup.html)
realPhoneTemplateId	65	Long	No	Template id reference Get real machine template by page
androidProp	{"persist.sys.cloud.wifi.mac": "D2:48:83:70:66:0B"}	Object	No	Reference Android modification property list
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─taskId	12818	Long	Task ID
├─padCode	AC22030010001	String	Instance ID
├─vmStatus	0	Integer	Instance online status (0: offline; 1: online)
Request Example


{ "padCodes": [
  "AC32010030001"
]
}
Response Example


{
  "code": 200,
  "msg": "success",
  "ts": 1732270378320,
  "data": {
    "taskId": 8405,
    "padCode": "AC32010030001",
    "vmStatus": 2
  }
}
Query the list of countries supported by one-click new machine
Interface address

/vcpcloud/api/padApi/country

Request method

GET

Request data type

application/json

Response parameters

Parameter name	Example value	Parameter type	Parameter description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─code	AD	String	Country code
├─name	Andorra	String	Country name (English)
Response example


{
    "code": 200,
    "msg": "success",
    "ts": 1730192434383,
    "data": [{ 
        "code": "AD", 
        "name": "Andorra" 
    }]
}
Switch Device
Interface URL

/vcpcloud/api/padApi/replacement

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCode	AC22030010001	String	Yes	Instance
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─equipmentId	358504	Long	Equipment number
├─padCode	AC32011030092	String	Instance number
Request Example


{
    "padCode": "AC32010030001"
}
Response Example


{
    "msg": "success",
    "code": 200,
    "data": {
        "padCode": "AC32011030092",
        "equipmentId": 358504
    },
    "ts": 1741078432830
}
Modify Instance Time Zone
Interface URL

/vcpcloud/api/padApi/updateTimeZone

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
timeZone	Asia/Shanghai	String	Yes	UTC standard time
padCodes	["AC22030010001"]	Array	Yes	Instance list
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─taskId	12818	Long	Task ID
├─padCode	AC22030010001	String	Instance ID
├─vmStatus	1	Integer	Instance online status (0: offline; 1: online)
Request Example


{
	"padCodes": [
		"AC32010140003"
	],
	"timeZone": "Asia/Shanghai"
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570663080,
	"data": [
		{
			"taskId": 12818,
			"padCode": "AC32010140003",
			"vmStatus": 1
		}
	]
}
Modify Instance Language
Interface URL

/vcpcloud/api/padApi/updateLanguage

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
language	zh	String	Yes	Language
country	CN	String	No	Country
padCodes	["AC22030010001"]	Array	Yes	Instance list
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─taskId	12818	Long	Task ID
├─padCode	AC22030010001	String	Instance ID
├─vmStatus	1	Integer	Instance online status (0: offline; 1: online)
Request Example


{
	"padCodes": [
		"AC32010140026"
	],
	"language": "zh",
	"country": ""
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570663080,
	"data": [
		{
			"taskId": 12818,
			"padCode": "AC32010140026",
			"vmStatus": 1
		}
	]
}
Modify sim card information according to country code
Static settings will take effect after the instance is restarted. You need to restart the instance to take effect. They are generally used to modify device information. This interface has the same function as the Modify instance Android modification properties interface. The difference is that this interface will generate additional sim card information and must be restarted every time.

After setting the instance attributes, the attribute changes will be stored persistently, and there is no need to call this interface again to restart or reset the instance.

Interface address

/vcpcloud/api/padApi/updateSIM

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCode	AC32010210001	String	Yes	PadCode
countryCode	US	String	No	Country Code
props	{}	Object	No	System properties (this field is key-value definition)
├─persist.sys.cloud.phonenum	15166370000	String	No	Property settings
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	status code
msg	success	String	response message
ts	1721739857317	Long	Timestamp
data	TASK-285633563817283584	String	Task ID
Request Example


{
    "countryCode": "CN",
    "padCode": "AC32010950933",
    "props": {
        "persist.sys.cloud.phonenum": "15166370000"
    }
}
Response Example


{
    "msg": "success",
    "code": 200,
    "data": "TASK-285633563817283584",
    "ts": 1740631552342
}
File upload interface directly through link
Push files from the file management center to the cloud phone instance (asynchronous task) If the corresponding file can be found through the md5 value or file ID, it will be directly sent to the instance for download through the OSS path. If OSS does not have the corresponding file, the URL will be directly sent to the instance for download, and the URL content will be uploaded to OSS. If you choose to install the application, it will check whether the package name has a value. If there is no value, an exception will be thrown. (Installing the application will authorize all permissions by default, and you can choose not to authorize through the isAuthorization field) Request method

Interface address

/vcpcloud/api/padApi/uploadFileV3

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCode	AC32010210001	String	Yes	PadCode
autoInstall	1	Integer	No	Whether automatic installation is required: 1 required, 0 not required. If left blank, it is not required by default. Only effective for apk type files
fileUniqueId	1e5d3bf00576ee8f3d094908c0456722	String	No	The unique identifier of the file id
customizeFilePath	/Documents/	String	No	Custom path. It is not required and must start with /.（Example："/DCIM/", "/Documents/", "/Download/", "/Movies/", "/Music/", "/Pictures/"）
fileName	threads	String	No	File name
packageName	com.zhiliaoapp.musically	String	No	File package name
url	https://file.vmoscloud.com/appMarket/2/apk/fe1f75df23e6fe3fd3b31c0f7f60c0af.apk	String	No	File installation path
md5	1e5d3bf00576ee8f3d094908c0456722	String	No	file unique identifier
isAuthorization	false	Boolean	No	Whether to authorize (default full authorization)
iconPath	https://file.vmoscloud.com/appMarket/2/apk/fe1f75df23e6fe3fd3b31c0f7f60c0af.png	String	No	Icon display during installation
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─padCode	AC22010020062	String	PadCode
├─taskId	1	Integer	Task ID
├─vmStatus	1	Integer	Instance online status (0: offline; 1: online)
Request Example


{
    "padCodes": [
        "AC32010250022"
    ],
    "customizeFilePath": "/DCIM/",
    "md5": "d97fb05b3a07d8werw2341f10212sdfs3sdfs24",
    "url": "https://file.vmoscloud.com/appMarket/2/apk/fe1f75df23e6fe3fd3b31c0f7f60c0af.apk",
    "autoInstall": 1,
    "packageName": "com.zhiliaoapp.musically",
    "fileName": "market",
    "isAuthorization": false
}
Response Example


{
    "code": 200,
    "msg": "success",
    "ts": 1737431505379,
    "data": [
        {
            "taskId": 13469,
            "padCode": "AC32010250022",
            "vmStatus": 0
        }
    ]
}
Set keepalive application interface
Currently only supports Android 14

Interface address

/vcpcloud/api/padApi/setKeepAliveApp

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCodes		String[]	Yes	
├─padCode	AC32010250011	String	No	Instance number
applyAllInstances	false	Boolean	Yes	Whether to apply all instance modes
appInfos		Object[]	No	
├─serverName	com.zixun.cmp/com.zixun.cmp.service.TaskService	String	Yes	com.xxx.xxx (package name)/com.xxx.xxx.service.DomeService (full path of the service to be started)
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1736326542985	Long	Timestamp
data		Object[]	Task data list
├─ taskId	10074	Integer	Task ID
├─ padCode	AC32010250011	String	Instance number
├─ errorMsg	null	String	Error message (null means no error)
Request Example


{
    "padCodes": [
        "AC32010250011"
    ],
        "appInfos": [
        {
            "serverName": "com.zixun.cmp/com.zixun.cmp.service.TaskService"
        }
    ],
        "applyAllInstances": false
}
Response Example


{
    "code": 200,
        "msg": "success",
        "ts": 1736326542985,
        "data": [
        {
            "taskId": 10074,
            "padCode": "AC32010250011",
            "errorMsg": null
        }
    ]
}
Error code

Error code	Error description	Operation suggestion
110065	Parameter request is not compliant, please refer to the interface document	Check parameters, refer to the interface document
120005	Instance does not exist	Please check whether the instance number is correct
Upload user image
Interface address

/vcpcloud/api/padApi/addUserRom

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
name	CloudROM-13	String	Yes	ROM name
updateLog	update	String	Yes	update log
androidVersion	13	String	Yes	android version
version	v1.0.0	String	Yes	version
downloadUrl	https://file.vmoscloud.com/userFile/userRom/d281d848eff49adee2dda2475235b80b2.tar	String	Yes	address
packageSize	236978175	String	yes	Size (Unit: Byte)
Response Parameters

字段名	示例值	类型	说明
code	200	Integer	Status code
msg	success	String	Response message
ts	1736326542985	Long	Timestamp
data	img-2505287582886572	String	image id
Request Example


{
    "name": "CloudROM-13-11",
    "updateLog": "update log",
    "androidVersion": "13",
    "version": "v1.0.0",
    "downloadUrl": "https://file.vmoscloud.com/userFile/userRom/d281d848eff49adee2dda2475235b80b2.tar", 
    "packageSize": 236978175,
}
Response Example


{
    "msg": "success",
    "code": 200,
    "data": "img-2505287582886572",
    "ts": 1748425758327
}
User Rom pagination
Interface address

/vcpcloud/api/padApi/userRomPage

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
name	CloudROM-13	String	no	ROM name
androidVersion	13	String	no	update log
current	1	int	yes	current page
size	10	int	yes	page size
响应参数

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1736326542985	Long	Timestamp
data		Object	
├─records		Object[]	
├─├─id	1	int	record id
├─├─name	CloudROM-13-01	String	name
├─├─androidVersion	13	String	android version
├─├─downloadUrl	13	String	address
├─├─imageId	13	String	image id
├─├─packageSize	236978175	int	size（unit：Byte）
├─├─version	v1.0.0	String	version
├─├─imageFailedRemark		String	reasion
├─total	1	int	total
├─size	10	int	page size
├─current	1	int	current
├─pages	1	int	pages
Request Example


{
    "name": "cloud", 
    "androidVersion": 13,  
    "current": 1,
    "size": 10 
}
Response Example


{
    "msg": "success",
    "code": 200,
    "data": {
        "records": [
            {
                "id": 27,
                "name": "CloudROM-13-01",
                "androidVersion": "13",
                "downloadUrl": "https://file.vmoscloud.com/userFile/userRom/d281d848eff49adee2dda2475235b80b2.tar",
                "imageId": "img-2505287929452799",
                "packageSize": 236978175,
                "updateLog": "update",
                "version": "v1.0.0",
                "imageFailedRemark": "下载文件失败: https://file.vmoscloud.com/userFile/userRom/d281d848eff49adee2dda2475235b80b2.tar",
            }
        ],
        "total": 2,
        "size": 10,
        "current": 1,
        "pages": 1
    },
    "ts": 1748428965816
}
Set Instance GPS Coordinates
Interface URL

/vcpcloud/api/padApi/gpsInjectInfo

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
longitude	116.397455	Float	Yes	Longitude (coordinate)
latitude	39.909187	Float	Yes	Latitude (coordinate)
padCodes	["AC22030010001"]	Array	Yes	List of instance IDs
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─taskId	12818	Long	Task ID
├─padCode	AC22030010001	String	Instance ID
├─vmStatus	1	Integer	Instance online status (0: offline; 1: online)
Request Example


{
	"padCodes": [
		"AC22030010001"
	],
	"longitude": 116.397455,
	"latitude": 39.909187
}

Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570663080,
	"data": [
		{
			"taskId": 12818,
			"padCode": "AC22030010001",
			"vmStatus": 1
		}
	]
}
Local Screenshot
Interface URL

/vcpcloud/api/padApi/screenshot

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCodes	[]	String[]	Yes	List of instance IDs
├─	AC11010000031	String	Yes	Instance ID
rotation	0	Integer	Yes	Screenshot orientation:
0: No rotation (default);
1: Rotate clockwise 90 degrees for landscape screenshots.
broadcast	false	Boolean	Yes	Whether to broadcast the event (default is false)
definition	50	Integer	No	Screenshot clarity, range 0-100
resolutionHeight	1920	Integer	No	Resolution height (greater than 1)
resolutionWidth	1080	Integer	No	Resolution width (greater than 1)
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─ taskId	12818	Long	Task ID
├─ padCode	AC11010000031	String	Instance ID
├─ vmStatus	1	Integer	Instance online status (0: offline; 1: online)
Request Example


{
    "padCodes": [
        "1721739857317"
    ],
        "rotation": 0,
        "broadcast": false,
        "definition": 50,
        "resolutionHeight": 1920,
        "resolutionWidth": 1080
}

Response Example


{
    "code": 200,
        "msg": "success",
        "ts": 1717570337023,
        "data": [
        {
            "taskId": 12818,
            "padCode": "AC11010000031",
            "vmStatus": 1
        }
    ]
}
Upgrade Image
Interface URL

/vcpcloud/api/padApi/upgradeImage

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCodes	[]	String[]	Yes	List of instance IDs
├─	AC22030010182	String	Yes	Instance ID
imageId	mg-24061124017	String	Yes	Image ID
wipeData	false	Boolean	Yes	Whether to wipe the instance data (data partition), true to wipe, false to keep
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─ taskId	12818	Long	Task ID
├─ padCode	AC22030010182	String	Instance ID
├─ errorMsg	""	String	Error message (if any)
Request Example


{
    "padCodes": [
        "AC22030010182"
    ],
    "wipeData": false,
    "imageId": "mg-24061124017"
}

Response Example


{
    "code": 200,
        "msg": "success",
        "ts": 1718594881432,
        "data": [
        {
            "taskId": 63,
            "padCode": "AC22030010182",
            "errorMsg": null
        }
    ]
}
Upgrade Real Device Image
Batch real device image upgrade for instances

Interface URL

/vcpcloud/api/padApi/virtualRealSwitch

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCodes	[]	String[]	Yes	List of instance IDs
├─	AC22030010182	String	Yes	Instance ID
imageId	mg-24061124017	String	Yes	Image ID
wipeData	false	Boolean	Yes	Whether to wipe the instance data (data partition), true to wipe, false to keep
realPhoneTemplateId	178	Integer	No	Real device template ID (required if upgradeImageConvertType=real)
upgradeImageConvertType	virtual	String	Yes	Type of image conversion: "virtual" for virtual machine, "real" for cloud real device
screenLayoutId	14	Integer	No	Screen layout ID (required if upgradeImageConvertType=virtual)
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─ taskId	12818	Long	Task ID
├─ padCode	AC22030010182	String	Instance ID
├─ errorMsg	""	String	Error message (if any)
Request Example


{
    "padCodes": [
        "AC32010210023"
    ],
        "imageId": "img-24112653977",
        "wipeData": true,
        "realPhoneTemplateId": 178,
        "upgradeImageConvertType": "virtual",
        "screenLayoutId": 14
}

Response Example


{
    "code": 200,
        "msg": "success",
        "ts": 1718594881432,
        "data": [
        {
            "taskId": 63,
            "padCode": "AC22030010182",
            "errorMsg": null
        }
    ]
}

Intelligent IP Proxy Check
Check whether the proxy IP is available and if the location information is correct

Interface URL

/vcpcloud/api/padApi/checkIP

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
host	127.0.0.1	String	Yes	Proxy information (IP or host)
port	8080	Integer	Yes	Proxy port (numeric type)
account	xxxx	String	Yes	Proxy username
password	xxxx	String	Yes	Proxy password
type	Socks5	String	Yes	Proxy protocol type: Socks5, http, https
country	US	String	No	Country - required when forcibly specified - parameters please refer to: ( curl -x http://username:password@ip:port https://ipinfo.io?token=registered_token ); When forced specification is used, the system will directly use the specified information and will not detect the proxy.
ip	156.228.84.62	String	No	ip - required when forcibly specified
loc	39.0438,-77.4874	String	No	Longitude, latitude - required when forced to specify
city	Ashburn	String	No	City - required when forcibly specified
region	Virginia	String	No	Region - required when forced to specify
timezone	America/New_York	String	No	Time zone - required when forcibly specified
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	
├─ proxyLocation	US-Los Angeles	String	Location of the proxy
├─ publicIp	62.112.132.92	String	Exit IP
├─ proxyWorking	true	Boolean	Proxy check result: true if successful, false if failed
Request Example


{
    "host": "62.112.132.92",
    "port": 45001,
    "account": "xxxxxxxxxx",
    "password": "xxxxxxxx",
    "type": "Socks5"
    // "country": "US"，
    // "ip": "156.228.84.62",
    // "loc": "39.0438,-77.4874", 
    // "city": "Ashburn", 
    // "region": "Virginia",
    // "timezone": "America/New_York"
}

Response Example


{
    "msg": "success",
    "code": 200,
    "data": {
        "proxyLocation": "US-Los Angeles",
        "publicIp": "62.112.132.92",
        "proxyWorking": true
    },
    "ts": 1737601218580
}

Set Intelligent IP
Set a smart IP for the cloud machine device, and the exit IP, SIM card information, GPS coordinates, time zone and other information in the cloud machine will automatically change to the country of origin of the agent (the device will restart after setting, and it will take effect within 1 minute after the restart is completed. At the same time, the device status will change to 119 - Initializing. After the task succeeds, fails, or times out, it will change to 100 - normal status. The task timeout time is 5 minutes)

Note: The intelligent IP information must first pass the detection via the check IP interface; direct setting may lead to incorrect country matching.

Interface URL

/vcpcloud/api/padApi/smartIp

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCodes		String[]	Yes	List of instance IDs
├─	AC22030010182	String	Yes	Instance ID
host	127.0.0.1	String	Yes	Proxy information (IP or host)
port	8080	Integer	Yes	Proxy port (numeric type)
account	xxxx	String	Yes	Proxy username
password	xxxx	String	Yes	Proxy password
type	Socks5	String	Yes	Proxy protocol type: Socks5, http, https
mode	vpn	String	Yes	Mode of the proxy: vpn / proxy
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
data	TASK-278784482960609280	String	Task ID
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
Request Example


{
    "padCodes": [
        "AC32010160334"
    ],
    "host": "62.112.132.92",
    "port": 45001,
    "account": "xxxxxx",
    "password": "xxxxxxx",
    "type": "Socks5",
    "mode": "vpn"
}

Response Example


{
    "msg": "success",
    "code": 200,
    "data": "TASK-278784482960609280",
    "ts": 1737604726812
}

Cancel Intelligent IP
Cancel the smart IP and restore the exit IP, SIM card information, GPS coordinates, time zone and other information in the cloud machine (the device will restart after setting, and it will take effect within 1 minute after the restart is completed. At the same time, the device status will change to 119 - initializing. After the task succeeds, fails, or times out, it will change to 100 - normal status. The task timeout is 5 minutes)

Interface URL

/vcpcloud/api/padApi/notSmartIp

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
padCodes		String[]	Yes	List of instance IDs
├─	AC22030010182	String	Yes	Instance ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
data	TASK-278784482960609280	String	Task ID
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
Request Example


{
    "padCodes": [
        "AC32010160334"
    ]
}

Response Example


{
    "msg": "success",
    "code": 200,
    "data": "TASK-278784482960609280",
    "ts": 1737604726812
}

Equipment task execution result query
Query task execution results using task number(Intelligent IP usage)

Interface URL

/vcpcloud/api/padApi/getTaskStatus

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
taskId	TASK-278784482960609280	String	YES	Task ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
data		Object[]	Task results
├─padCode	AC32010150162	String	Instance ID
├─taskStatus	Successfully	String	Task status: Executing-executing、Successfully-has succeeded、Failed-has failed、Timedout-has timed out
├─taskType	10010	Integer	Task type: 10010-Set Smart IP、 10011-Cancel Smart IP
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
Request Example


{
    "taskId": "TASK-278784482960609280"
}

Response Example


{
    "msg": "success",
    "code": 200,
    "data": [
        {
            "padCode": "AC32010150162",
            "taskStatus": "Successfully",
            "taskType": 10010
        }
    ],
    "ts": 1738999472135
}

Switch Root Permission
Enable or disable root permission in one or more cloud phone instances. To switch root for a single app, the package name must be specified, otherwise an exception will be thrown.

API Endpoint

/vcpcloud/api/padApi/switchRoot

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	List of instance codes (padCodes)
├─	AC22020020793	String	Yes	Instance code
globalRoot	false	Boolean	No	Whether to enable global root permission (default is false)
packageName	com.zixun.cmp	String	No	Application package name (required for non-global root)
rootStatus	root开启状态	Integer	Yes	Root status, 0: disable, 1: enable
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1721739857317	Long	Timestamp
data		Object[]	Data list
├─ taskId	1	Long	Task ID
├─ padCode	AC22020020793	String	Instance code
├─ vmStatus	1	Integer	Instance online status (0: offline, 1: online)
Request Example


{
    "padCodes": [
        "AC32010250002"
    ],
    "globalRoot": false,
    "packageName": "com.android.ftpeasys",
    "rootStatus": 0
}

Response Example


{
    "code": 200,
        "msg": "success",
        "ts": 1717570297639,
        "data": [
            {
                "taskId": 1,
                "padCode": "AC32010250002",
                "vmStatus": 1
            }
        ]
}


Error Codes
Error Code	Error Description	Suggested Action
110003	ADB command execution failed	Contact the administrator
110089	Package name cannot be empty when enabling root for a single app	The package name must be provided when enabling root for a single app
Resource Management Related API
Instance List Informationrmation
Retrieve instance list information based on query conditions with pagination.

Interface URL

/vcpcloud/api/padApi/infos

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Parameter Description
page	1	Integer	Yes	Page number
rows	10	Integer	Yes	Number of records per page
padType	real	String	No	Instance type (virtual: Virtual machine; real: Real device)
padCodes		String[]	No	List of instance IDs
├─	AC22010020062	String	Yes	Instance ID
groupIds		Integer[]	No	List of instance group IDs
├─	1	Integer	No	Instance group ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Parameter Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1713773577581	Long	Timestamp
data		Object	Response data
├─ page	1	Integer	Current page
├─ rows	10	Integer	Number of records per page
├─ size	1	Integer	Number of records on the current page
├─ total	1	Integer	Total number of records
├─ totalPage	1	Integer	Total number of pages
├─ pageData		Object[]	List of instances
├─ ├─ padCode	VP21020010391	String	Instance ID
├─ ├─ padGrade	q1-2	String	Instance opening grade (q1-6 for six openings, q1-2 for two openings)
├─ ├─ padStatus	10	Integer	Instance status (10 for running, 11 for restarting, 12 for resetting, 13 for upgrading, 14 for abnormal, 15 for not ready)
├─ ├─ groupId	0	Integer	Group ID
├─ ├─ idcCode	d3c1f580c41525e514330a85dfdecda8	String	Data center code
├─ ├─ deviceIp	192.168.0.0	String	Cloud device IP
├─ ├─ padIp	192.168.0.0	String	Instance IP
├─ ├─ apps		String[]	List of installed apps
├─ ├─ ├─ armcloud001	String	String	Installed app name
Request Example


{
	"page": 1,
	"rows": 10,
	"padCodes": [
		"AC21020010391"
	],
	"groupIds":[1]
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts":1713773577581,
	"data": {
		"page": 1,
		"rows": 1,
		"size": 1,
		"total": 1,
		"totalPage": 1,
		"pageData": [
			{
				{
				"padCode": "AC21020010391",
				"padGrade": "q2-4",
				"padStatus": 10,
				"groupId": 0,
				"idcCode": "8e61ad284bc105b877611e6fef7bdd17",
				"deviceIp": "172.31.2.34",
				"padIp": "10.255.1.19",
				"apps": [
					"armcloud001"
				]
			}
		]
	}
}
Application Management
App Start
Start an app on an instance based on the instance ID and app package name.

API Endpoint

/vcpcloud/api/padApi/startApp

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
pkgName	xxx.test.com	String	Yes	Package Name
padCodes		String[]	Yes	
├─	AC22010020062	String	Yes	Instance Code
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
ts	1756021167163	Long	Timestamp
data		Object[]	
├─ taskId	1	Integer	Task ID
├─ padCode	AC22010020062	String	Instance Code
├─ vmStatus	1	Integer	Instance Online Status (0: Offline; 1: Online)
Request Example


{
	"padCodes": [
		"AC22010020062"
	],
	"pkgName": "xxx.test.com"
}

Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570663080,
	"data": [
		{
			"taskId": 24,
			"padCode": "AC22010020062",
			"vmStatus": 1
		}
	]
}

Error Codes

Error Code	Error Description	Recommended Action
110008	Failed to start the app	Restart the cloud machine and try starting the app again
Stop App
Perform the operation of stopping an app on an instance based on the instance ID and app package name.

API Endpoint

/vcpcloud/api/padApi/stopApp

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
pkgName	xxx.test.com	String	Yes	Package Name
padCodes		String[]	Yes	Instance IDs
├─	AC22010020062	String	Yes	Instance ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
ts	1756021167163	Long	Timestamp
data		Object[]	Data List
├─taskId	1	Integer	Task ID
├─padCode	AC22010020062	String	Instance ID
├─vmStatus	1	Integer	Instance Online Status (0: Offline; 1: Online)
Request Example


{
	"padCodes": [
		"AC22010020062"
	],
	"pkgName": "xxx.test.com"
}

Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570663080,
	"data": [
		{
			"taskId": 24,
			"padCode": "AC22010020062",
			"vmStatus": 1
		}
	]
}

Error Codes

Error Code	Error Description	Suggested Action
110010	Failed to stop app	Restart the cloud machine and close the app
Application Restart
Restart an application on an instance based on the instance ID and application package name.

API Endpoint

/vcpcloud/api/padApi/restartApp

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
pkgName	xxx.test.com	String	Yes	Package name
padCodes		String[]	Yes	Instance IDs
├─	AC22010020062	String	Yes	Instance ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	Response data
├─ taskId	1	Integer	Task ID
├─ padCode	AC22010020062	String	Instance ID
├─ vmStatus	1	Integer	Instance online status (0: Offline; 1: Online)
Request Example


{
	"padCodes": [
		"AC22010020062"
	],
	"pkgName": xxx.test.com
}

Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1717570663080,
	"data": [
		{
			"taskId": 24,
			"padCode": "AC22010020062",
			"vmStatus": 1
		}
	]
}

Error Codes

Error Code	Error Description	Suggested Action
110009	Failed to stop app	Restart the cloud machine and close the app
Error Codes

Error Code	Description	Suggested Action
110009	Application restart failed	Restart the cloud machine and then start the application
Instance installed application list query
Query the instance installed application list information.

API Address:

/vcpcloud/api/padApi/listInstalledApp

Request Method:

POST

Request Data Type:

application/json

Request Body Parameters:

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	Instance identifier list
├─	AC22010020062	String	Yes	Instance identifier
appName		String	否	Application name
Response Parameters:

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1713773577581	Long	Timestamp
data		Object[]	
├─ padCode	AC22010020062	String	Instance ID
├─ apps		Object[]	Application list
│ ├─ appName	TapTap	String	Application name
│ ├─ packageName	com.taptap.global	String	Application package name
│ ├─ versionName	3.49.0-full.100000	String	Application version name
│ ├─ versionCode	349001000	String	Application version code
│ ├─ appState	0	Integer	0 Completed 1 Installing 2 Downloading
Request Example



{
    "padCodes": ["AC32010780841"],
    "appName": null
}
Response Example


{
    "msg": "success",
        "code": 200,
        "data": [
            {
                "padCode": "AC32010780841",
                "apps": [
                    {
                        "appName": "TapTap",
                        "packageName": "com.taptap.global",
                        "versionName": "3.49.0-full.100000",
                        "versionCode": "349001000",
                        "appState": 0
                    }
                ]
            }
        ], 
        "ts": 1740020993436
}
Task Management
Instance Operation Task Details
Query the detailed execution result of a specified instance operation task.

API Address:

/vcpcloud/api/padApi/padTaskDetail

Request Method:

POST

Request Data Type:

application/json

Request Body Parameters:

Parameter Name	Example Value	Parameter Type	Required	Description
taskIds		Integer[]	Yes	List of task IDs
├─ taskId	1	Integer	Yes	Task ID
Response Parameters:

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	Subtask list details
├─ taskId	1	Integer	Subtask ID
├─ padCode	VP22020020793	String	Instance identifier
├─ taskStatus	2	String	Task status (-1: all failed; -2: partial failure; -3: canceled; -4: timeout; 1: pending execution; 2: executing; 3: completed)
├─ endTime	1713429401000	Long	Subtask end timestamp
├─ taskContent	“”	String	Task content
├─ taskResult	“”	String	Task result
├─ errorMsg	“”	String	Error message
Request Example


{
	"taskIds":[1,2]
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1716283460673,
	"data": [
		{
			"taskId": 1,
			"padCode": "AC22030022441",
			"taskStatus": 2,
			"endTime": 1713429401000,
			"taskContent": null,
			"taskResult": null
		},
		{
			"taskId": 2,
			"padCode": "AC22030022442",
			"taskStatus": 2,
			"endTime": 1713429401001,
			"taskContent": null,
			"taskResult": null
		}
	]
}
File Task Details
Query the detailed execution result of a specified file task.

API Address:

/vcpcloud/api/padApi/fileTaskDetail

Request Method:

POST

Request Data Type:

application/json

Request Body Parameters:

Parameter Name	Example Value	Parameter Type	Required	Description
taskIds		Integer[]	Yes	List of task IDs
├─ taskId	1	Integer	Yes	Task ID
Response Parameters:

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1756021167163	Long	Timestamp
data		Object[]	Task list details
├─ taskId	1	Integer	Subtask ID
├─ appId	134	Long	Application ID
├─ fileUniqueId	e2c07491309858c5cade4bfc44c03724	String	Unique file identifier
├─ fileName	xx.apk	String	File name
├─ taskStatus	2	Integer	Task status (-1: all failed; -2: partial failure; -3: canceled; -4: timeout; 1: pending execution; 2: executing; 3: completed)
├─ endTime	1713429401000	Long	Subtask end timestamp
Request Example


{
	"taskIds":[
		1,2
	]
}
Response Example


{
	"code": 200,
	"msg": "success",
	"ts": 1716283460673,
	"data": [
		{
			"taskId": 1,
			"appId": 134,
			"fileUniqueId": "e2c07491309858c5cade4bfc44c03724",
			"fileName": "xx.apk",
			"taskStatus": 2,
			"endTime": 1713429401000
		},
		{
			"taskId": 2,
			"appId": 135,
			"fileUniqueId": "e2c07491309858c5cade4bfc43c03725",
			"fileName": "xx.apk",
			"taskStatus": 2,
			"endTime": 1713429401001
		}
	]
}
Automation Management
When performing automated tasks, do not operate on the cloud machine by performing actions such as rebooting, resetting, upgrading the image, or replacing machines, as this could interfere with the automated tasks.

Automated Task List Query
Query the list of automated tasks.

API Endpoint

/vcpcloud/api/padApi/autoTaskList

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
taskIds		Long[]	No	Task ID array
taskType	1	Integer	No	Task type: 1-login, 2-edit profile, 3-search short videos, 4-randomly browse videos, 5-publish video, 6-publish gallery
page	1	Integer	Yes	Page number
rows	10	Integer	Yes	Number of records per page
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
ts	1736327056700	Long	Timestamp
data		Object	Data details
├─ records		Object[]	Record list
│ ├─ taskId	115	Integer	Task ID
│ ├─ userId	14114	Integer	User ID
│ ├─ equipmentId	106588	Integer	Equipment ID
│ ├─ padCode	AC32010180421	String	Instance ID
│ ├─ padName	zzzzz	String	Instance name
│ ├─ taskType	1	Integer	Task type: 1-login, 2-edit profile, 3-search short videos, 4-randomly browse videos, 5-publish video, 6-publish gallery
│ ├─ taskName	testAdd	String	Task name
│ ├─ executionStatus	0	Integer	Execution status: -2-cancelled task, -1-failed, 0-pending, 1-in progress, 2-successful
│ ├─ plannedExecutionTime	2025-01-09 00:00:00	String	Planned execution time
│ ├─ executionEndTime	null	String	Execution end time
│ ├─ createdTime	2025-01-08 14:25:01	String	Creation time
│ ├─ failureReason	null	String	Failure reason
├─ total	46	Integer	Total records
├─ size	10	Integer	Number of records per page
├─ current	1	Integer	Current page
├─ pages	5	Integer	Total pages
Request Example


{
    "page": 1,
    "rows": 10
}
Response Example


{
	"msg": "success",
	"code": 200,
	"data": {
		"records": [
			{
				"id": 121,
				"taskId": 121,
				"userId": 14114,
				"equipmentId": 106653,
				"padCode": "AC32010180522",
				"padName": "V04",
				"taskType": 1,
				"taskName": "testAdd",
				"executionStatus": 2,
				"plannedExecutionTime": "2025-01-08 18:02:00",
				"executionEndTime": "2025-01-08 18:08:11",
				"createdTime": "2025-01-08 18:01:03",
				"failureReason": null
			}
		],
		"total": 46,
		"size": 10,
		"current": 1,
		"pages": 5
	},
	"ts": 1736331989341
}
Create Automation Task
Create an automation task. Make sure to pass the correct device number (the cloud phone list interface will return the device number). The task is mainly bound to the device number. If a device swap occurs before execution, it will not affect task loss. (Asynchronous, the system will check if the TK app is installed on the cloud phone. If not, it will automatically download the TK app before executing the task. Do not manually operate the cloud phone during the TK download and task execution). The request parameters for different tasks may vary; examples will be provided.

API Endpoint

/vcpcloud/api/padApi/addAutoTask

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
taskName	testAdd	String	Yes	Task name
remarks	test	String	No	Remarks
taskType	1	Integer	Yes	Task type: 1-login, 2-edit profile, 3-search short videos, 4-randomly browse videos, 5-publish video, 6-publish gallery
list		Object[]	Yes	Task list
├─ equipmentId	106653	Integer	Yes	Equipment ID
├─ padCode	AC32010180522	String	Yes	Instance ID
├─ plannedExecutionTime	2025-01-08 17:20:00	String	Yes	Planned execution time
├─ addInfo	Refer to the request example	JSONObject	Yes	Task parameters (Note: Follow the corresponding format based on the task type, otherwise the task will fail)
Request Example


{
    "taskName": "testAdd",
    "remarks": "test",
    "taskType": 1,
    "list": [
        {
            "equipmentId": 106653,
            "padCode": "AC32010180522",
            "plannedExecutionTime": "2025-01-08 17:20:00",
            "addInfo": {
                "password": "zhouxi12....",
                "username": "zzx833454@gmail.com"
            }
        }
    ]
}
Login Task Parameters (Task Type - taskType: 1)

Parameter Name	Example Value	Parameter Type	Required	Description
password	zzxxxx@gmail.com	String	Yes	Account
username	zzxxxx@gmail.com	String	Yes	Password
Edit Profile Task Parameters (Task Type - taskType: 2)

Parameter Name	Example Value	Parameter Type	Required	Description
link	https://xxxx.png	String	Yes	Avatar URL (greater than 250x250)
username	test	String	Yes	Name
Search Short Video Task Parameters (Task Type - taskType: 3)

Parameter Name	Example Value	Parameter Type	Required	Description
tag	Title	String	Yes	Tag
timeout	10	Integer	Yes	Viewing duration (seconds) Note: The maximum time is 2 hours, otherwise the task will time out and fail
Random Video Browsing Task Parameters (Task Type - taskType: 4)

Parameter Name	Example Value	Parameter Type	Required	Description
timeout	10	Integer	Yes	Viewing duration (seconds) Note: The maximum time is 2 hours, otherwise the task will time out and fail
tag	""	String	No	Tag
Publish Video Task Parameters (Task Type - taskType: 5)

Parameter Name	Example Value	Parameter Type	Required	Description
link	https://xxxx	String	No	Video OSS URL
copywriting	test	String	Yes	Copywriting
productId	null	String	No	product id
Publish Image Gallery Task Parameters (Task Type - taskType: 6)

Parameter Name	Example Value	Parameter Type	Required	Description
links	[https://xxxx]	array[String]	Yes	Image OSS URLs (up to ten images)
copywriting	test	String	Yes	Copywriting
bgm	bgm	String	Yes	Background music name
Video like and comment task parameters (task type - taskType: 7)

Parameter name	Example value	Parameter type	Required	Parameter description
timeout	10	Integer	Yes	Watching time (seconds) Note: Up to 2 hours, otherwise the task will time out and fail
tag	""	String	No	Tag
contents	["wow"]	array[String]	No	Comment content Note: Currently only 1 is supported, and it will be expanded later
Live broadcast heating task parameters (task type - taskType: 8)

Parameter name	Example value	Parameter type	Required	Parameter description
timeout	10	Integer	Yes	Watching time (seconds) Note: Up to 2 hours, otherwise the task will time out and fail
liveRoomId	"xlavandulax"	String	Yes	Anchor ID
contents	"wow"	String	Yes	Comment content
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	0	Integer	Status Code: 0 - Success
msg	success	String	Response Message
ts	1736327056700	Long	Timestamp
data		Object {}	Subtask list details
├─ taskIds		Long[]	Task ID Array
Response Example


{
	"msg": "success",
	"code": 200,
	"taskIds": [
		116
	],
	"ts": 1736327380399
}
Automated Task Retry
Automated task retry.

API Endpoint

/vcpcloud/api/padApi/reExecutionAutoTask

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
taskIds		Long[]	Yes	Task ID array
plannedExecutionTime	2025-01-08 17:30:00	Date	Yes	Planned execution time
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
data		Object {}	Subtask list details
ts	1736327056700	Long	Timestamp
├─ taskIds		Long[]	New task ID array
Request Example


{
    "taskIds": [
        109
    ],
    "plannedExecutionTime": "2025-01-08 17:30:00"
}
Response Example


{
	"msg": "success",
	"code": 200,
	"taskIds": [
		118
	],
	"ts": 1736327771611
}
Automated Task Cancellationlation
Automated task cancellation.

API Endpoint

/vcpcloud/api/padApi/cancelAutoTask

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
taskIds		Long[]	Yes	Task ID array
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status Code
msg	success	String	Response Message
ts	1736327056700	Long	Timestamp
Request Example


{
    "taskIds": [
        118
    ]
}
Response Example


{
	"msg": "success",
	"code": 200,
	"ts": 1736327841671
}
Cloud Phone Management
Create Cloud Phone
Create a new cloud phone. (Note that the purchased product package must be available on the web platform, otherwise the purchase will fail.)

API Endpoint

/vcpcloud/api/padApi/createMoneyOrder

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
androidVersionName	Android13	String	Yes	Android version: Android10、Android13, Android14
goodId	1	Integer	Yes	Product ID (corresponding to the Product ID value of SKU Package List)
goodNum	1	Integer	Yes	Product quantity
autoRenew	true	Boolean	Yes	Whether to auto-renew (enabled by default)
equipmentId	106626,106627	String	Yes	Renewal device IDs (comma separated for multiple devices)
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
data		Object[]	Data list
├─ id	7644	Integer	Unique data identifier
├─ orderId	VMOS-CLOUD173630666722957907	String	Order number
├─ equipmentId	106662	Integer	Equipment ID
├─ createTime	2025-01-08 11:24:31	String	Creation time
├─ creater	14114	String	Creator
ts	1736306672346	Long	Timestamp
Request Example


{
    "androidVersionName": "Android13",
    "goodId": 1,
    "goodNum": 1,
    "autoRenew": true
}
Response Example


{
	"msg": "success",
	"code": 200,
	"data": [
		{
			"id": 7644,
			"orderId": "VMOS-CLOUD173630666722957907",
			"equipmentId": 106662,
			"createTime": "2025-01-08 11:24:31",
			"creater": "14114"
		}
	],
	"ts": 1736306672346
}
Cloud Phone List
Cloud phone list.

API Endpoint

/vcpcloud/api/padApi/userPadList

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCode	null	String	No	Instance code
equipmentIds		Integer[]	No	Array of equipment IDs
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
code	200	Integer	Status code
msg	success	String	Response message
ts	1736235894274	Long	Timestamp
data		Object[]	Data list
├─ padCode	AC32010180421	String	Cloud phone code
├─ deviceIp	172.30.5.43	String	Cloud phone physical machine IP
├─ padIp	10.254.21.225	String	Cloud phone virtual IP
├─ cvmStatus	100	Integer	Cloud phone status (100 - normal, 101 - capturing screenshot, 102 - restarting, 103 - resetting, 104 - abnormal)
├─ screenshotLink	https://XXXXXX.png	String	Cloud phone screenshot link
├─ equipmentId	106626	Integer	Equipment ID
├─ userId	14114	Integer	User ID
├─ status	1	Integer	Device status
├─ padName	V08	String	Cloud phone display name
├─ bootTime	1735643626263	Long	Cloud phone usage time
├─ cumulativeUseTime	null	Object	Total device usage time
├─ lastBackupTime	null	Object	Last backup time
├─ maintainContent	null	Object	Maintenance content
├─ goodId	1	Integer	Product ID
├─ goodName	i18n_Android13-V08	String	Product name
├─ signExpirationTime	2025-01-31 19:13:46	String	Signed cloud phone expiration time
├─ signExpirationTimeTamp	1738322026000	Long	Signed cloud phone expiration timestamp
├─ supplierType	5	String	Supplier type
├─ androidVersionAvatar	https://XXXX.png	String	Android version avatar
├─ configName	V08	String	Product model name
├─ androidVersionAvatar2	https://XXX.png	String	Android version avatar 2
├─ androidVersionAvatar3	https://XXX.png	String	Android version avatar 3
├─ androidVersion	13	String	Android version
├─ authorizedUserId	null	Object	Authorized user ID
├─ authorizedExpirationTime	null	Object	Authorization expiration time
├─ authorizedExpirationTimeTamp	null	Object	Authorization expiration timestamp
├─ changeConfig	1	Integer	Support for configuration change (0 - no, 1 - yes)
├─ createTime	2024-12-31 19:13:46	String	Creation time
├─ proxyIp	null	Object	Proxy IP address
├─ remark		String	Remark
├─ proxyId	null	Object	Proxy IP information
├─ ipAddress	null	Object	IP address location
├─ publicIp	null	Object	Public IP
├─ groupId	null	Object	Group ID
├─ groupName	null	Object	Group name
├─ groupSort	null	Object	Group sorting order
Cloud Phone Status

Status Code	Description
99	Loading
100	Normal
101	Getting Screenshot
102	Rebooting
103	Resetting
104	Reboot Failed
105	Reset Failed
106	Maintenance
107	Upgrading Image
108	Migrating Instance
109	Migration Failed
111	Device Configuration
112	Anti-Fraud Lockdown
113	Config Change
114	Over Selling
115	Changing Zone
116	Cleaning Memory
119	Initializing Cloud Machine
120	One-click New Machine Initialization
121	Task Execution in Progress
201	Backing Up
202	Restoring
Request Example


{
    "padCode": null,
    "equipmentIds": [
        106626
    ]
}
Response Example


{
  "msg": "success",
  "code": 200,
  "ts": 1736235894274,
  "data": [
    {
      "padCode": "AC32010180421",
      "deviceIp": "172.30.5.43",
      "padIp": "10.254.21.225",
      "cvmStatus": 100,
      "screenshotLink": "https://XXXXXX.png",
      "equipmentId": 106626,
      "userId": 14114,
      "status": 1,
      "padName": "V08",
      "bootTime": 1735643626263,
      "cumulativeUseTime": null,
      "lastBackupTime": null,
      "maintainContent": null,
      "goodId": 1,
      "goodName": "i18n_Android13-V08",
      "signExpirationTime": "2025-01-31 19:13:46",
      "signExpirationTimeTamp": 1738322026000,
      "supplierType": "5",
      "androidVersionAvatar": "https://XXXX.png",
      "configName": "V08",
      "androidVersionAvatar2": "https://XXX.png",
      "androidVersionAvatar3": "https://XXX.png",
      "androidVersion": "13",
      "authorizedUserId": null,
      "authorizedExpirationTime": null,
      "authorizedExpirationTimeTamp": null,
      "changeConfig": 1,
      "createTime": "2024-12-31 19:13:46",
      "proxyIp": null,
      "remark": "",
      "proxyId": null,
      "ipAddress": null,
      "publicIp": null,
      "groupId": null,
      "groupName": null,
      "groupSort": null
    }
  ]
}
Cloud Phone Information Query
Query cloud phone information.

API Endpoint

/vcpcloud/api/padApi/padInfo

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Type	Required	Description
padCode	AC32010180421	String	Yes	Instance ID
Response Parameters

Parameter Name	Example Value	Type	Description
msg	success	String	Response Message
code	200	Integer	Status Code
data		Object	Response Data
├─ explain	English	String	Language - Explanation
├─ simCountry	SG	String	SIM Card Country
├─ country	SG	String	Country
├─ padCode	AC32010180421	String	Instance ID
├─ padType	V08	String	Device Model
├─ bluetoothAddress	3A:1F:4B:9C:2D:8E	String	Bluetooth Address
├─ initializationData	{"explain":"English", ...}	String	Device Information
├─ groupId	0	String	Group ID
├─ latitude	1.3398	String	Latitude
├─ ipAddress	Hong Kong	String	IP Address
├─ timeZone	Asia/Singapore	String	Time Zone
├─ publicIp	192.169.96.14	String	Public IP
├─ phoneNumber	+6510633153	String	Virtual Phone Number
├─ androidVersion	Android13	String	Android Version
├─ wlanMac	4c:7f:11:2f:a6:cc	String	WLAN MAC Address
├─ padName	V08	String	Pad Name
├─ simIso	M1	String	SIM Card ISO
├─ longitude	103.6967	String	Longitude
├─ operatorNumeric	52503	Integer	Operator Number
├─ padImei	525036719631842	String	IMEI
ts	1736239152927	Long	Timestamp
Request Example


{
    "padCode": null
}
Response Example


{
	"msg": "success",
	"code": 200,
	"data": {
		"explain": "English",
		"simCountry": "SG",
		"country": "SG",
		"padCode": "AC32010180421",
		"padType": "V08",
		"bluetoothAddress": "3A:1F:4B:9C:2D:8E",
		"initializationData": "{\"explain\":\"English\",\"country\":\"SG\",\"simJson\":{\"simCountry\":\"SG\",\"operatorShortname\":\"M1\",\"imei\":\"979706209497838\",\"imsi\":\"525036719631842\",\"phonenum\":\"6510633153\",\"operatorNumeric\":\"52503\"},\"latitude\":\"1.3398\",\"timeZone\":\"Asia/Singapore\",\"language\":\"en\",\"longitude\":\"103.6967\"}",
		"groupId": "0",
		"latitude": "1.3398",
		"ipAddress": "Hong Kong",
		"timeZone": "Asia/Singapore",
		"publicIp": "192.169.96.14",
		"phoneNumber": "+6510633153",
		"androidVersion": "Android13",
		"wlanMac": "4c:7f:11:2f:a6:cc",
		"padName": "V08",
		"simIso": "M1",
		"longitude": "103.6967",
		"operatorNumeric": 52503,
		"padImei": "525036719631842"
	},
	"ts": 1736239152927
}
SKU Package List
Get the SKU package list.

API Endpoint

/vcpcloud/api/padApi/getCloudGoodList

Request Method

GET

Request Data Type

application/json

Response Parameters

Parameter Name	Example Value	Type	Description
msg	success	String	Response Message
code	200	Integer	Status Code
data		Object	Response Data
├─ androidVersionName	Android13	String	Android Version Name
├─ cloudGoodsInfo		Object	SKU Package Information
│ ├─ configs		List	Product Model Information
│ │ ├─ configName	Samsung s23 ultra	String	Product Model Name
│ │ ├─ sellOutFlag	false	Boolean	Sold Out Flag
│ │ ├─ configBlurb	Top technology, comparable to real machine supreme experience!	String	Product Model Description
│ │ ├─ defaultSelection	false	Boolean	Default Selection Flag
│ │ ├─ reorder	0	Integer	Sort Order
│ │ ├─ goodTimes		List	Product Price Information
│ │ │ ├─ oldGoodPrice	100	Integer	Original Price
│ │ │ ├─ showContent	1 day	String	Product Duration Name
│ │ │ ├─ whetherFirstPurchase	true	Boolean	First Purchase Flag
│ │ │ ├─ reorder	1	Integer	Sort Order
│ │ │ ├─ goodPrice	100	Integer	Product Price
│ │ │ ├─ equipmentNumber	1	Integer	Product Shipping Equipment Quantity
│ │ │ ├─ goodTime	1440	Integer	Product Duration (Minutes)
│ │ │ ├─ autoRenew	true	Boolean	Supports Auto Renewal
│ │ │ ├─ recommendContent	First purchase special offer	String	Recommended Content
│ │ │ ├─ id	27	Integer	Product ID
ts	1737440589859	Long	Timestamp
Response Example


{
    "msg": "success",
        "code": 200,
        "data": [
        {
            "androidVersionName": "Android13",
            "cloudGoodsInfo": {
                "configs": [
                    {
                        "configName": "Samsung s23 ultra",
                        "sellOutFlag": false,
                        "configBlurb": "顶尖科技，媲美真机至尊体验！",
                        "defaultSelection": false,
                        "reorder": 0,
                        "goodTimes": [
                            {
                                "oldGoodPrice": 100,
                                "showContent": "1天",
                                "whetherFirstPurchase": true,
                                "reorder": 1,
                                "goodPrice": 100,
                                "equipmentNumber": 1,
                                "goodTime": 1440,
                                "autoRenew": true,
                                "recommendContent": "首购特惠",
                                "id": 27
                            }
                        ]
                    }
                ],
                "goodId": 1
            }
        }
    ],
        "ts": 1737440589859
}
Modify Real Machine ADI Template
Modify the cloud real machine ADI template by passing the cloud real machine template ID.

Prerequisites:

The instance must be created as a cloud real machine type.
The instance's specifications must match the target ADI template specifications.
The instance's Android version must match the target ADI Android version.
API Endpoint

/vcpcloud/api/padApi/replaceRealAdiTemplate

Request Method

POST

Request Data Type

application/json

Request BODY Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		String[]	Yes	List of instance codes
├─	AC22010020062	String	Yes	Instance Code
wipeData	false	Boolean	Yes	Whether to wipe data
realPhoneTemplateId	186	Long	Yes	Cloud Real Machine Template ID
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
data		Object	Response data
├─ taskId	1	Integer	Task ID
├─ padCode	AC21020010001	String	Instance Code
├─ vmStatus	1	Integer	Instance online status (0: offline; 1: online)
Request Example


{
    "padCodes": ["AC32010250011"],
    "wipeData": true,
    "realPhoneTemplateId": 186
}

Response Example


{
    "code": 200,
        "msg": "success",
        "ts": 1736326542985,
        "data": [{
        "taskId": 10074,
        "padCode": "AC32010250011",
        "errorMsg": null
    }]
}

Cloud machine simulated touch
The cloud machine simulates the touch interface. The result can be queried through the Instance operation task details interface.

API Endpoint

/vcpcloud/api/padApi/simulateTouch

Request Method

POST

Request Data Type

application/json

Request BODY Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCodes		Object[]	Yes	Instance code that needs to trigger a click
├─ ACP250329MMRFCCT		String	Yes	Pad Code
width	1080	Integer	Yes	Touch container width
height	1920	Integer	Yes	Touch container height
positions		Object[]	Yes	Touch coordinate collection
├─ actionType	1	Integer	Yes	Operation type (0: pressed; 1: lifted; 2: touching)
├─ x	100	float	Yes	x coordinate of click
├─ y	100	float	Yes	y coordinate of click
├─ nextPositionWaitTime	100	Integer	Yes	When there are multiple sets of coordinates, the waiting interval in milliseconds to trigger the next set of click coordinates
Response Example

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
data		Object	Response data
├─ padCode	ACP250329MMRFCCT	String	PadCode
├─ taskId	10004759	Long	task id
├─ vmStatus	0	Integer	Instance online status (0: offline; 1: online)
Request Example


{
    "padCodes": [
        "ACP250329MMRFCCT"
    ],
    "width": 1080,
    "height": 1920,
    "positions": [
        {
            "actionType": 0,
            "x": 100,
            "y": 100,
            "nextPositionWaitTime": 20
        },
        {
            "actionType": 2,
            "x": 110,
            "y": 110,
            "nextPositionWaitTime": 22
        },
        {
            "actionType": 2,
            "x": 120,
            "y": 120,
            "nextPositionWaitTime": 23
        },
        {
            "actionType": 1,
            "x": 120,
            "y": 120
        }
    ]
}

Response Example


{
    "code": 200,
    "msg": "success",
    "ts": 1743676563784,
    "data": [
        {
            "taskId": 100059,
            "padCode": "ACP250329MMRFCCT",
            "vmStatus": 0
        },
        {
            "taskId": 100060,
            "padCode": "ACP250329MMRFCCT",
            "vmStatus": 0
        }
    ]
}

Android image version collection
Get the image set that can be upgraded on the current device

API Endpoint

/vcpcloud/api/padApi/imageVersionList

Request Method

POST

Request Data Type

application/json

Request BODY Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCode	ACP250329MMRFCCT	String	YES	PadCode
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	response message
code	200	Integer	status code
data		Object[]	Data list
├─ nowImgId	img-25033129396	String	Current device image version ID
├─ hasNewVersion	false	Boolean	Whether there is an image version that can be upgraded.
├─ imageVersionList		Object[]	Image version list
├─├─ imageId	img-25033129396	String	Image version ID
├─├─ version	20250401	Integer	Image version
├─├─ versionName	20250401	String	Image version Name
├─├─ publishType	released	String	Release type: released-stable, beta-latest
├─├─ imageIllustrate	Fixed the issue that the Coffee Meet Begal app cannot activate location services	String	Mirror update instructions
├─├─ romSdkint	14	Integer	Android version Code
├─├─ romSdkName	Android 14	String	Android release notes
Request Example


{
    "padCode": "ACP250329MMRFCCT"
}
Response Example


{
    "msg": "success",
        "code": 200,
        "data": {
        "nowImgId": "img-25033129396",
        "imageManageList": [
            {
                "imageId": "img-25040148674",
                "version": 20250401,
                "versionName": "20250401",
                "publishType": "released",
                "imageIllustrate": "Fixed the issue that the Coffee Meet Begal app cannot activate location services",
                "romSdkint": 34,
                "romSdkName": "Android 14"
            },
            {
                "imageId": "img-25033136513",
                "version": 20250331,
                "versionName": "20250331",
                "publishType": "released",
                "imageIllustrate": "Expand the tool model to add a blacklist",
                "romSdkint": 34,
                "romSdkName": "Android 14"
            },
            {
                "imageId": "img-25040129277",
                "version": 20250401,
                "versionName": "20250401",
                "publishType": "released",
                "imageIllustrate": "termux supports root",
                "romSdkint": 29,
                "romSdkName": "Android 10"
            },
            {
                "imageId": "img-25040872272",
                "version": 30000013,
                "versionName": "30000013",
                "publishType": "beta",
                "imageIllustrate": "B",
                "romSdkint": 33,
                "romSdkName": "Android 13"
            },
            {
                "imageId": "img-25032893685",
                "version": 20250328,
                "versionName": "20250328",
                "publishType": "released",
                "imageIllustrate": "1.tools add language",
                "romSdkint": 33,
                "romSdkName": "Android 13"
            }
        ],
        "hasNewVersion": false
    },
    "ts": 1744181920213
}
Equipment Pre-sale Purchase
When stock is insufficient, you can use this API to pre-order a device (only applicable to cloud phone products with a rental period of 30 days or more). Once stock is replenished, the system will prioritize fulfilling pre-sale orders and automatically dispatch the devices. After the order is shipped, users will receive an email notification and an additional one-day usage bonus.

API Endpoint

/vcpcloud/api/padApi/createMoneyProOrder

Request Method

POST

Request Data Type

application/json

Request BODY Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
androidVersionName	Android13	String	是	Android Version：Android10、Android13、Android14
goodId	1	Integer	是	Product ID (corresponding to the Product ID value of SKU Package List)
goodNum	1	Integer	是	Product Number
autoRenew	true	Boolean	是	Whether to automatically renew (default closed) true-on, false-off
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
data	VMOS-CLOUD174290228048631464	String	Pre-sale order number
Request Example


{
    "androidVersionName": "Android13",
    "goodId": 75,
    "goodNum": 1,
    "autoRenew": true
}
Response Example


{
	"msg": "success",
	"code": 200,
	"data": "VMOS-CLOUD174290228048631464",
	"ts": 1736306672346
}
Query pre-sale order result details
Query the details of pre-sale order results. You can query by pre-sale order number, order status (1-to be shipped 2-shipped, empty default all)

API Endpoint

/vcpcloud/api/padApi/queryProOrderList

Request Method

POST

Request Data Type

application/json

Request BODY Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
proBuyStatus	2	Integer	No	1-To be shipped 2-Shipment If empty, default to all
orderId	VMOS-CLOUD174290228048631464	Integer	No	Pre-sale order number
Response Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
msg	success	String	Response message	
code	200	Integer	Status code	
data		Object[]	Data list	
├─ proBuyOrderId	VMOS-CLOUD174290228048631464	String	Pre-sale order number	
├─ proBuyStatus	2	Integer	1-To be shipped 2-Shipment	
├─ proBuyNumber	1	Integer	Purchase quantity	
├─ createTime	2025-03-25 19:31:21	String	creation time	
├─ payTime	2025-03-25 19:31:21	String	payment time	
├─ endTime	2025-03-25 19:41:33	String	Shipping time	
├─ orderPrice	1399	Integer	Order Amount (cents)	
├─ goodName	Samsung Galaxy A53	String	Device name	
ts	1736306672346	Long	Timestamp	
Request Example


{
    "proBuyStatus": "2",
    "orderId": "VMOS-CLOUD174290228048631464"
}
Response Example


{
    "msg": "success",
        "code": 200,
        "data": [
        {
            "proBuyOrderId": "VMOS-CLOUD174290228048631464",
            "proBuyStatus": 2,
            "proBuyNumber": 1,
            "createTime": "2025-03-25 19:31:21",
            "payTime": "2025-03-25 19:31:21",
            "endTime": "2025-03-25 19:41:33",
            "orderPrice": 499,
            "goodName": "V08"
        },
        {
            "proBuyOrderId": "VMOS-CLOUD174323615535421664",
            "proBuyStatus": 2,
            "proBuyNumber": 1,
            "createTime": "2025-03-29 16:16:22",
            "payTime": "2025-03-29 16:16:22",
            "endTime": "2025-03-29 16:18:03",
            "orderPrice": 1399,
            "goodName": "Samsung Galaxy A53"
        }
    ],
        "ts": 1743239203460
}
SDK Token Issuance
Issue a temporary STS Token for user authentication to access the cloud mobile phone service.

Get SDK Temporary Token
API Endpoint

/vcpcloud/api/padApi/stsToken

Request Method

GET

Request Data Type

application/json

Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
data		Object	Data list
├─ token	18df5803-48ce-4b53-9457-6a15feb1daca	String	SDK communication token
Response Example


{
    "code": 200,
    "msg": "success",
    "ts":1713773577581,
    "data": {
        "token": "18df5803-48ce-4b53-9457-6a15feb1daca"
    }
}
SDK Token Issuance (by padCode)
Issue a temporary STS Token for user authentication to access the cloud mobile phone service (the token can only be used for the specified padCode).

Get SDK Temporary Token by padCode
API Endpoint

/vcpcloud/api/padApi/stsTokenByPadCode

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
padCode	AC32010230001	String	Yes	Instance ID (padCode)
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
data		Object	Data list
├─ token	18df5803-48ce-4b53-9457-6a15feb1daca	String	SDK communication token
Request Example


{"padCode":"AC32010230001"}
Response Example


{
    "code": 200,
        "msg": "success",
        "ts":1713773577581,
        "data": {
        "token": "18df5803-48ce-4b53-9457-6a15feb1daca"
    }
}
Clear SDK Authorization Token
API Endpoint

/vcpcloud/api/padApi/clearStsToken

Request Method

POST

Request Data Type

application/json

Request Body Parameters

Parameter Name	Example Value	Parameter Type	Required	Description
token	123	String	Yes	The token to be cleared
Response Parameters

Parameter Name	Example Value	Parameter Type	Description
msg	success	String	Response message
code	200	Integer	Status code
data		Object	Data list
Request Example


{"token":1234}
Response Example


{
    "code": 200,
        "msg": "success",
        "ts":1713773577581,
        "data": null
}
Instance File Upload Callback
Usage Scenario

Customers need to configure the callback URL on the WEB platform. Once the configuration is successful, the system will automatically start receiving callback notifications by default.

Field	Type	Example	Description
taskBusinessType	Integer	1009	Task business type
taskId	Integer	1	Task ID
result	boolean	true	Execution result: true - success, false - failure
errorCode	String		Error code
padCode	String	AC22030022001	Instance identifier
fileId	String	cf08f7b685ab3a7b6a793b30de1b33ae34	File ID
Example


{
    "errorCode": null,
    "fileId": "cfec132ab3c4e1aff5515c4467d9bbe460",
    "padCode": "AC22030022001",
    "result": true,
    "taskBusinessType": 1009,
    "taskId": 10659,
    "taskResult": "Success",
    "taskStatus": 3
}
Application Installation Callback
Usage Scenario

When a customer initiates an application installation, this callback interface notifies the customer about the installation status.

Field	Type	Example	Description
taskBusinessType	Integer	1003	Task business type
taskId	Integer	1	Task ID
apps	Object[]		Application information
├─ appId	Integer	10001	Application ID
├─ appName	String	demo	Application name
├─ pkgName	String	com.xxx.demo	Package name
├─ padCode	String	AC22030022001	Instance identifier
├─ result	boolean	true	Installation result flag. true: success, false: failure
├─ failMsg	String	This application is blacklisted and cannot be installed	Failure message
Example


{
    "endTime": 1734939747000,
    "padCode": "AC22030022001",
    "taskBusinessType": 1003,
    "taskContent": "",
    "taskId": 10613,
    "taskResult": "Success",
    "taskStatus": 3
}
Application Uninstallation Callback
Usage Scenario

When a customer initiates an application uninstallation, this callback interface notifies the customer about the uninstallation status.

Field	Type	Example	Description
taskBusinessType	Integer	1004	Task business type
taskId	Integer	1	Task ID
apps	Object		Application information
├─ appId	Integer	10001	Application ID
├─ appName	String	demo	Application name
├─ pkgName	String	com.xxx.demo	Package name
├─ padCode	String	AC22030022001	Instance ID
├─ result	boolean	true	Installation result flag. true: success, false: failure
Example


{
    "endTime": 1734940052000,
    "padCode": "AC22030022001",
    "taskBusinessType": 1004,
    "taskContent": "",
    "taskId": null,
    "taskResult": "Success",
    "taskStatus": 3
}
Application Startup Callback
Usage Scenario

When a customer initiates an application startup, this callback interface notifies the customer about the startup status.

Field	Type	Example	Description
taskBusinessType	Integer	1007	Task business type
taskId	Integer	1	Task ID
taskStatus	Integer	3	Task status (-1: All failed; -3: Canceled; -4: Timeout; 1: Pending; 2: In progress; 3: Completed)
padCode	String	AC22030022001	Instance identifier
pkgName	String	xxx.test.com	Package name
Example


{
    "taskBusinessType": 1007,
    "packageName": "com.quark.browser",
    "padCode": "AC22030022001",
    "taskId": 10618,
    "taskStatus": 3
}
Application Stop Callback
Usage Scenario

When a customer initiates an application stop, this callback interface notifies the customer about the stop status.

Field	Type	Example	Description
taskBusinessType	Integer	1005	Task business type
taskId	Integer	1	Task ID
taskStatus	Integer	3	Task status (-1: All failed; -3: Canceled; -4: Timeout; 1: Pending; 2: In progress; 3: Completed)
padCode	String	AC22030022001	Instance identifier
pkgName	String	xxx.test.com	Package name
Example


{
    "taskBusinessType": 1005,
    "packageName": "com.quark.browser",
    "padCode": "AC22030022001",
    "taskId": 10618,
    "taskStatus": 3
}
Application Restart Callback
Usage Scenario

When a customer initiates an application restart, this callback interface notifies the customer about the restart status.

Field	Type	Example	Description
taskBusinessType	Integer	1006	Task business type
taskId	Integer	1	Task ID
taskStatus	Integer	3	Task status (-1: All failed; -3: Canceled; -4: Timeout; 1: Pending; 2: In progress; 3: Completed)
padCode	String	AC22030022001	Instance identifier
pkgName	String	xxx.test.com	Package name
Example


{
    "taskBusinessType": 1006,
    "packageName": "com.quark.browser",
    "padCode": "AC22030022001",
    "taskId": 10618,
    "taskStatus": 3
}
The callback is returned on the user image
Usage Scenario

The user image is uploaded, and the result is notified to the customer through this callback interface.

Field	Type	Example	Description
taskBusinessType	Integer	4001	Task business type
imageId	String	img-2505244083302766	image id
taskStatus	Integer	3	Task status（-1：failed；3：Completed）
failMsg	Stirng	3	fail reason
Example


{
    "imageId": "img-2505244083302766",
    "taskBusinessType": 4001,
    "taskStatus": 3
}


System error code description
Error codes that may be returned by the interface and corresponding solutions:

code	msg	solution
2031	Invalid key	Invalid key
2032	Required parameter missing in request header: Authorization	Required parameter missing in request header: Authorization
2019	Signature verification failed	Signature verification failed
1104	Required parameter is empty	Please check whether the parameter meets the requirements
2020	Instance does not exist	Instance does not exist
100000	Incorrect request parameters	Please check whether the parameters meet the requirements
100001	No access rights	Contact the administrator to open permissions
100002	Unable to obtain HttpServlet request object	Confirm whether the request method and parameters are correct
100003	Missing request header Authorization	Check whether the request header contains Authorization
100004	Invalid signature	Please check whether the signature is correct
100005	Signature verification failed	Confirm that the signature method is correct
100006	Request lacks token	Confirm whether the token is correctly passed
100007	Invalid token	Check whether the token is expired
100008	token Verification failed	Confirm token validity
100009	Account information missing	Check parameters, refer to call example
100010	Processing failed	Retry, if multiple failures occur, please contact the administrator
100011	The same request is in progress	Try again later
100012	Unsupported HTTP request method	Confirm supported request types
100013	Parameter type and format errors	Please check parameter format
110014	Submissions too frequently	Try again later
120006	Token bound uuid does not match	Please check parameters
120007	The interface does not support this function	Contact the administrator
120008	Token does not belong to the current user	Confirm token ownership
110013	Instance does not exist	Please check instance parameters
110031	Instance is not ready	Wait for the instance to be in Ready state

Modem Properties List
Configurable properties in the Android system:

Non-persistent storage: Can be set via the modemPropertiesList parameter in the "Update Instance Properties (updatePadProperties)" interface (non-persistent, takes effect immediately, but lost after instance restart).
Persistent storage: Can be set via the modemPersistPropertiesList parameter in the "Update Instance Properties (updatePadProperties)" interface (persistent, takes effect after instance restart).
Persistent Call
Request Example:


"modemPersistPropertiesList":[{
  "propertiesName":"IMEI",
  "propertiesValue":"897654321"
},
  {
    "propertiesName":"ICCID",
    "propertiesValue":"00998877"
  }]
Non-Persistent Call
Request Example:


"modemPropertiesList":[{
  "propertiesName":"IMEI",
  "propertiesValue":"897654321"
},
  {
    "propertiesName":"ICCID",
    "propertiesValue":"00998877"
  }]
Property List
Property（key）	Property Value（value）	Description
IMEI	897654321	
ICCID	00998877	
IMSI	4600112345	
MCCMNC	461,01	
OpName	China Mobile	
PhoneNum	861380013800	
System Properties List
Configurable properties in the Android system:

Non-persistent storage: Can be set via the systemPropertiesList parameter in the "Update Instance Properties (updatePadProperties)" interface (non-persistent, takes effect immediately, but lost after instance restart).
Persistent storage: Can be set via the systemPersistPropertiesList parameter in the "Update Instance Properties (updatePadProperties)" interface (persistent, takes effect after instance restart).
Persistent Call
Request Example:


"systemPersistPropertiesList":[{
  "propertiesName":"ro.product.manufacturer",
  "propertiesValue":"XIAOMI"
},
  {
    "propertiesName":"ro.product.brand",
    "propertiesValue":"XIAOMI"
  }]
Non-Persistent Call

Request Example:
"systemPropertiesList":[{
  "propertiesName":"ro.product.manufacturer",
  "propertiesValue":"XIAOMI"
},
  {
    "propertiesName":"ro.product.brand",
    "propertiesValue":"XIAOMI"
  }]
Property List
General Properties
Property (key)	Property Value (value)	Description
ro.product.manufacturer	e.g., HW	Manufacturer
ro.product.brand	e.g., HW	Brand
ro.product.model	e.g., LYA_AL00	Model
ro.build.id	0	Build tag
ro.build.display.id	0	Build version number
ro.product.name	e.g., LYA_AL00	Product name
ro.product.device	e.g., HWLYA	Device information
ro.product.board	e.g., LYA	Board name
ro.build.tags	e.g., dev-keys/release-keys	
ro.build.fingerprint	0	System fingerprint
ro.build.date.utc	0	Firmware compilation timestamp
ro.build.user	0	Firmware compilation user
ro.build.host	0	Firmware compilation host
ro.build.description	0	Compilation description
ro.build.version.incremental	0	Internal version number
ro.build.version.codename	0	codename
Other Properties
Allowed Properties with Specific Prefixes
"ro.build.", "ro.product.", "ro.odm.", "ro.vendor.", "ro.system_ext.", "ro.system.", "ro.com.", "ro.config."

However, not all properties under these prefixes are open. Some restricted properties are maintained in the blacklist below. Additionally, some properties without these prefixes are allowed, which are maintained in the whitelist.

Blacklisted Properties (Non-modifiable)
"ro.build.type", "ro.build.vername", "ro.build.version.release", "ro.build.version.sdk", "ro.build.version.name", "ro.product.cpu.abi", "ro.product.cpu.abilist", "ro.product.cpu.abilist32", "ro.product.cpu.abilist64", "ro.odm.build.type", "ro.odm.build.version.release", "ro.odm.build.version.sdk", "ro.odm.product.cpu.abilist", "ro.odm.product.cpu.abilist32", "ro.odm.product.cpu.abilist64", "ro.vendor.build.type", "ro.vendor.build.version.release", "ro.vendor.build.version.sdk", "ro.vendor.product.cpu.abilist", "ro.vendor.product.cpu.abilist32", "ro.vendor.product.cpu.abilist64", "ro.system.build.type", "ro.system.build.version.release", "ro.system.build.version.sdk"

Whitelisted Properties (Modifiable)
"ro.board.platform", "ro.bootimage.build.fingerprint", "ro.baseband", "ro.boot.wificountrycode", "ro.bootimage.build.date", "ro.bootimage.build.date.utc", "ro.gfx.driver.0", "ro.revision", "ro.ril.svdo", "ro.ril.svlte1x", "ro.serialno",

Simulated SIM
Property (key)	Property Value (value)	Description
aic.sim.state	Example: 5	0;1: No SIM card; 2: SIM_STATE_NETWORK_LOCKED; 3: SIM card PIN locked; 4: SIM card PUK locked; 5: SIM card normal
aic.operator.shortname	Example: CMCC	Operator short name
aic.operator.numeric	Example: 46001	Network operator ID (i.e., MCCMNC)
aic.spn	Example: China Mobile	SIM card operator name
aic.iccid	Example: 89860002191807255576	SIM card number
aic.imsi	Example: 460074008004488	Prefix is the SIM card operator number: MCC (3 digits) + MNC (2 or 3 digits)
aic.phonenum	Example: 18629398873	Phone number
aic.net.country	Example: CHINA	Network country
aic.sim.country	Example: CHINA	SIM card country
aic.signal.strength	Example: {"cdmaDbm"=0,"cdmaEcio"=1,"evdoDbm"=2,"evdoEcio"=3,"evdoSnr"=4,"rssi"=-51,"asulevel"=30,"ber"=0,"ta"=0,"rscp"=-51,"ecNo"=10,"rsrp"=1,"rsrq"=43,"rssnr"=300,"cqi"=15,"csiRsrp"=-44,"csiRsrq"=-3,"csiSinr"=23,"csiCqiTableIndex"=0,"ssRsrp"=-44,"ssRsrq"=-3,"ssSinr"=40,"parametersUseForLevel"=22}	Signal strength
aic.deviceid	Example: 370483496	Electronic serial number
aic.cellinfo	Example: {"lac"=4049,"cid"=1463,"sid"=149,"arfcn"=arfcn,"bsic"=133,"alphal"="","alphas"="CMCC","psc"=11,"ci"=11,"psc"=11,"pci"=22,"tac"=33, "earfcn"=44,"bandwidth"=144}	Effective base station fields in different modes: GSM: int lac, int cid, int arfcn, int bsic, String mccStr, String mncStr, String alphal, String alphas CDMA: int lac, int cid, int psc, int uarfcn, String mccStr, String mncStr, String alphal, String alphas LTE: int mcc, int mnc, int ci, int pci, int tac, String mccStr, String mncStr, String alphal, String alphas NR: int csiRsrp, int csiRsrq, int csiSinr, int ssRsrp, int ssRsrq, int ssSinr # The fields mccStr, mncStr, mcc, mnc will be obtained from modem/aic.operator.numeric, no need to pass them here
aic.net.type	Example: 13	Data network type: gsm/lte/cdma (China Telecom), default is lte ## 0-20; NETWORK_TYPE_CDMA=4; NETWORK_TYPE_LTE=13; NETWORK_TYPE_GSM=16; NETWORK_TYPE_NR=20 # 5G
aic.radio.type	Example: 13	Voice network type: gsm/lte/cdma (China Telecom), default is lte (VoLTE); NETWORK_TYPE_CDMA=4; NETWORK_TYPE_LTE=13; NETWORK_TYPE_GSM=16; NETWORK_TYPE_NR=20 # 5G
aic.gid1	Example: FF	GroupLevel1, its specific meaning depends on the operator’s definition and may represent different services or specific functions.
aic.alphatag	Example: abcdefg	A string stored on the SIM card, usually representing the name or brand of the mobile network operator.
aic.nai	Example: abcdefg	NAI is a string used to identify a device's identity in a mobile network.
Effective Signal Strength Parameters in Different Modes
CDMA:int cdmaDbm, int cdmaEcio, int evdoDbm, int evdoEcio, int evdoSnr GSM: int rssi, int ber, int ta WCDMA:int rssi, int ber, int rscp, int ecno TDSCDMA：int rssi, int ber, int rscp LTE:int rssi, int rsrp, int rsrq, int rssnr, int cqi, int timingAdvance NR: int csiRsrp, int csiRsrq, int csiSinr, int ssRsrp, int ssRsrq, int ssSinr

Signal strength value range reference
//cdma public int cdmaDbm; // This value is the RSSI value public int cdmaEcio; // This value is the Ec/Io public int evdoDbm; // This value is the EVDO RSSI value public int evdoEcio; // This value is the EVDO Ec/Io public int evdoSnr; // Valid values are 0-8. 8 is the highest signal to noise ratio //public int level;

//gsm public int rssi; // in dBm [-113, -51] or UNAVAILABLE public int ber; // bitErrorRate; // bit error rate (0-7, 99) TS 27.007 8.5 or UNAVAILABLE public int ta; // timingAdvance; // bit error rate (0-7, 99) TS 27.007 8.5 or UNAVAILABLE

//wcdma public int rscp; // in dBm [-120, -24] public int ecno; // range -24, 1, CellInfo.UNAVAILABLE if unknown

//lte //public int rssi; // in dBm [-113,-51], UNKNOWN public int rsrp; // in dBm [-140,-43], UNKNOWN public int rsrq; // in dB [-20,-3], UNKNOWN public int rssnr; // in 10*dB [-200, +300], UNKNOWN public int cqi; // [0, 15], UNKNOWN //public int ta; // [0, 1282], UNKNOWN

//Nr public int csiRsrp; // [-140, -44], UNKNOWN public int csiRsrq; // [-20, -3], UNKNOWN public int csiSinr; // [-23, 23], UNKNOWN

public int csiCqiTableIndex; public List mCsiCqiReport; public int ssRsrp; // [-140, -44], UNKNOWN public int ssRsrq; // [-20, -3], UNKNOWN public int ssSinr; // [-23, 40], UNKNOWN

public int mParametersUseForLevel;

Setting Properties
Request Example:


"settingPropertiesList":[{
  "propertiesName":"ssaid/com.demo1",
  "propertiesValue":"2345243531"
},
  {
    "propertiesName":"ssaid/com.demo2",
    "propertiesValue":"123456789"
  },
  {
    "propertiesName":"language",
    "propertiesValue":"zh-CN"
  }]
Attribute List
Attribute (key)	Attribute Value (value)	Attribute Description
ssaid/com.cheersucloud.cimi.sample	897654321	Android ID
bt/mac	1A:75:FF:88:2A:06	Bluetooth MAC
language	zh-CN	System Language
timezone	Asia/Shanghai	System Time Zone
systemvolume	10	Fixed media volume, range: 0-15
OAID Properties
Request Example:


"oaidPropertiesList":[{
  "propertiesName":"UDID",
  "propertiesValue":"111111111"
},
  {
    "propertiesName":"OAID",
    "propertiesValue":"123456789"
  },
  {
    "propertiesName":"language",
    "propertiesValue":"zh-CN"
  }]
Attribute List
Attribute (key)	Attribute Value (value)	Attribute Description
UDID	11111111	The unique identifier for iOS devices. Each iOS device has a unique UDID. However, since 2018, Apple has prohibited developers from accessing the UDID, replacing it with the Vendor ID (Vendor Identifier).
OAID	22222222	An anonymous identifier for Android devices, developed and promoted by the China Mobile Internet Industry Alliance (CCIA). It aims to replace the device ID (IMEI) and Android ID (the unique identifier of the Android system) to enable precise cross-app and cross-platform ad targeting while protecting user privacy.
VAID	33333333	A manufacturer advertising identifier for Android devices, provided by device manufacturers. VAID can be used for precise cross-app and cross-platform ad targeting. Unlike OAID, VAID is not an anonymous identifier.
AAID	44444444	A unique identifier provided by the Google Play Services framework for precise cross-app and cross-platform ad targeting. It is also designed to protect user privacy. Users can reset their AAID at any time and prevent apps from accessing it.

Property Examples and Introduction
The following read-only properties prefixed with "ro." can only be modified when the current instance is a virtual machine.

Some exceptions for "ro." properties can be set on cloud-based real devices, such as:

ro.sys.cloud.android_id (Android ID)

{
  // Model, brand, model, fingerprint information settings
  "ro.build.fingerprint" : "google/raven/raven:13/TQ1A.230105.002/9325679:user/release-keys",
  "ro.build.description" : "raven-user 13 TQ1A.230105.002 9325679 release-keys",
  "ro.product.brand" : "google",
  "ro.product.model" : "raven",
  "ro.product.manufacturer" : "google",
  "ro.product.device" : "raven",
  "ro.product.name" : "raven",
  "ro.build.version.incremental" : "9325679",
  "ro.build.flavor" : "raven-user",
  "ro.product.board" : "raven",
  "ro.build.product" : "raven",
  "ro.hardware" : "raven",
  "ro.odm.build.fingerprint" : "google/raven/raven:13/TQ1A.230105.002/9325679:user/release-keys",
  "ro.product.build.fingerprint" : "google/raven/raven:13/TQ1A.230105.002/9325679:user/release-keys",
  "ro.system.build.fingerprint" : "google/raven/raven:13/TQ1A.230105.002/9325679:user/release-keys",
  "ro.system_ext.build.fingerprint" : "google/raven/raven:13/TQ1A.230105.002/9325679:user/release-keys",
  "ro.vendor.build.fingerprint" : "google/raven/raven:13/TQ1A.230105.002/9325679:user/release-keys",
  "ro.product.odm.device" : "raven",
  "ro.product.odm.model" : "raven",
  "ro.product.odm.name" : "raven",
  "ro.product.product.device" : "raven",
  "ro.product.product.model" : "raven",
  "ro.product.product.name" : "raven",
  "ro.product.system.device" : "raven",
  "ro.product.system.model" : "raven",
  "ro.product.system.name" : "raven",
  "ro.product.system_ext.device" : "raven",
  "ro.product.system_ext.model" : "raven",
  "ro.product.system_ext.name" : "raven",
  "ro.product.vendor.device" : "raven",
  "ro.product.vendor.model" : "raven",
  "ro.product.vendor.name" : "raven",

  // Android ID
  "ro.sys.cloud.android_id" : "xxxxxxxxxxxx",

  // Media DRM ID
  "persist.sys.cloud.drm.id" : "400079ef55a4475558eb60a05c4a4335121238f13fdd48c10026e2847a6fc7a6",

  // GPU
  "persist.sys.cloud.gpu.gl_vendor" : "my_gl_vendor",
  "persist.sys.cloud.gpu.gl_renderer" : "my_gl_renderer",
  "persist.sys.cloud.gpu.gl_version" : "\"OpenGL ES 3.2\"",
  
  // SIM
  // mcc mnc
  "persist.sys.cloud.mobileinfo" : "525,01",

// type,mcc,mnc,tac(hex),cellid(hex),narfcn(hex),pci(hex)
// type:
// Indicates the network type, such as LTE, 5G, UMTS or GSM.
// This is usually used to determine the communication technology used by the current connection.
// Currently needs to be fixed to 9, representing 5G

// mcc (Mobile Country Code):
// Mobile country code, which identifies the country where the network is located. For example, 460 represents China and 525 represents Singapore.

// mnc (Mobile Network Code):
// Mobile network code, used to identify a specific operator. For example, Singapore's MNC code 01 may represent Singtel.

// tac (Tracking Area Code): Hexadecimal
// Tracking area code, used to partition mobile networks so that mobile devices can perform location updates.
// Widely used in LTE and 5G networks to help operators determine the physical location of devices.

// cellid (Cell Identity): Hexadecimal
// Cell ID, which identifies the ID of a single base station.
// CellID plus TAC can accurately locate the base station to which a device is connected.

// narfcn (NR Absolute Radio Frequency Channel Number): Hexadecimal
// This is the absolute frequency channel number in the 5G network, which specifies the specific frequency for communication between the device and the base station.

// physicalcellid (PCI): Hexadecimal
// Physical cell ID, which identifies the physical cell on a specific frequency. For LTE and NR (5G), PCI is used to distinguish signals from adjacent base stations.
  "persist.sys.cloud.cellinfo" : "9,525,01,2CA,E867D07,6A4,78",
  // IMEI
  "persist.sys.cloud.imeinum" : "759344050201724",
  // ICCID
  "persist.sys.cloud.iccidnum" : "68681042080146961320",
  // IMSI
  "persist.sys.cloud.imsinum" : "525010862935902",
  // Mobile phone numbers must start with the country code, for example, Singapore is 65
  "persist.sys.cloud.phonenum" : "6590523545",

  // gps
  "persist.sys.cloud.gps.lat" : "1.357703",
  "persist.sys.cloud.gps.lon" : "103.817543",
  "persist.sys.cloud.gps.speed" : "0.1",
  "persist.sys.cloud.gps.altitude" : "15",
  "persist.sys.cloud.gps.bearing" : "73",

  // Battery capacity (mAh)
  "persist.sys.cloud.battery.capacity" : "5000",

  // Battery information (initial value at startup, normal charging and discharging will be simulated after startup)
  "persist.sys.cloud.battery.level" : "80",

  // language
  "persist.sys.language" : "en",
  // country
  "persist.sys.country" : "HK",
  // Time Zone  
  "persist.sys.timezone" : "Asia/Hong_Kong",

  // wifi
  "persist.sys.cloud.wifi.mac" : "00:02:00:00:00:00",
  "persist.sys.cloud.wifi.ip" : "192.168.100.25",
  "persist.sys.cloud.wifi.gateway" : "192.168.100.1",
  "persist.sys.cloud.wifi.dns1" : "192.168.100.1",

  // App installation source
  "persist.sys.cloud.pm.install_source" : "com.android.vending",

  // Set network proxy properties, effective at boot, no additional settings required
  // Proxy type socks5, http-relay
  "ro.sys.cloud.proxy.type" : "socks5",
  // Proxy configuration Proxy IP, Proxy port, Proxy user, Proxy password, true (enable proxy)
  // Notes:
  // 1. The | character cannot exist in the proxy user and proxy password
  // 2. When there is no user and password, just leave it blank, like this 134.81.40.147|54212|||true
  "ro.sys.cloud.proxy.data" : "134.81.40.147|54212|username|password|true"
  // Proxy mode
  // proxy is to use the system iptables capability to implement the proxy function
  // vpn is to use the Android system VPN capability to implement the proxy function, supporting DNS leak prevention
  "ro.sys.cloud.proxy.mode" : "proxy"
}
