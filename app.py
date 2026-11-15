from __future__ import annotations

import json
import os
import platform
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

from src.dashboard_services import (
    DatasetService, PreprocessingService, TrainingService, PredictionService,
    ExplainabilityService, ReportService, ModelArtifactService,
    EnsemblePredictionService, prediction_map,
)


ROOT = Path(__file__).resolve().parent
DATA_DIR = Path(os.getenv("GEOFLOOD_DATA_DIR", ROOT / "data"))
ARTIFACT_DIR = Path(os.getenv("GEOFLOOD_ARTIFACT_DIR", ROOT / "artifacts"))
REPORT_DIR = Path(os.getenv("GEOFLOOD_REPORT_DIR", ROOT / "reports"))
LOG_DIR = Path(os.getenv("GEOFLOOD_LOG_DIR", ROOT / "logs"))
PAGES = ["Overview", "Geospatial Explorer", "Dataset Manager", "Historical Analysis",
         "Model Laboratory", "Flood Susceptibility", "Explainable AI", "Analytics", "Reports", "Settings"]
ICONS = ["⌂", "◎", "▤", "◷", "⚗", "⌖", "✳", "◫", "⇩", "⚙"]

st.set_page_config(page_title="GeoFlood AI", page_icon="🌊", layout="wide", initial_sidebar_state="expanded")
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
:root{--bg:#07111F;--bg2:#0B1929;--panel:#102238;--line:#203650;--text:#E6F0FA;--muted:#8EA5BD;--cyan:#39D0DF;--blue:#3185E8}
html,body,[class*="css"]{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.stApp{background:radial-gradient(ellipse at 82% -15%,rgba(35,111,175,.18),transparent 40%),var(--bg);color:var(--text)}
[data-testid="stHeader"]{background:rgba(7,17,31,.82)} [data-testid="stSidebar"]{background:linear-gradient(180deg,#0B1929,#07111F);border-right:1px solid var(--line)}
h1,h2,h3{letter-spacing:-.035em}h1{font-weight:800} .gf-eye{color:var(--cyan);font-size:.72rem;text-transform:uppercase;letter-spacing:.15em;font-weight:700;margin-bottom:.25rem}
.gf-sub{color:var(--muted);margin-top:-.35rem}.gf-panel{background:linear-gradient(145deg,rgba(16,34,56,.96),rgba(10,25,42,.96));border:1px solid var(--line);border-radius:15px;padding:18px 20px;min-height:105px}
.gf-label{color:var(--muted);text-transform:uppercase;letter-spacing:.08em;font-size:.7rem;font-weight:700}.gf-value{font-size:1.65rem;font-weight:800;padding-top:8px}.gf-note{color:var(--muted);font-size:.78rem}
div[data-testid="stMetric"]{background:linear-gradient(145deg,rgba(16,34,56,.96),rgba(10,25,42,.96));border:1px solid var(--line);padding:14px 17px;border-radius:13px}
.stButton>button[kind="primary"],.stFormSubmitButton>button{background:linear-gradient(100deg,#2678d6,#21aabe);border:0;border-radius:9px;font-weight:700}
[data-testid="stDataFrame"]{border:1px solid var(--line);border-radius:12px;overflow:hidden}hr{border-color:var(--line)}
@media(max-width:800px){.gf-panel{padding:14px;min-height:90px}.gf-value{font-size:1.35rem}}
</style>""", unsafe_allow_html=True)


def records():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    try:
        return json.loads((DATA_DIR / "catalog.json").read_text())
    except (OSError, json.JSONDecodeError):
        return []


def log_activity(action, detail):
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    item = {"timestamp": datetime.now(timezone.utc).isoformat(), "action": action, "detail": detail}
    path = LOG_DIR / "activity.jsonl"
    with path.open("a") as stream:
        stream.write(json.dumps(item) + "\n")


def activity():
    path = LOG_DIR / "activity.jsonl"
    if not path.exists(): return []
    result = []
    for line in path.read_text().splitlines()[-10:]:
        try: result.append(json.loads(line))
        except json.JSONDecodeError: continue
    return list(reversed(result))


def heading(title, subtitle, section="GEOFLOOD AI / RESEARCH WORKSPACE"):
    st.markdown(f'<div class="gf-eye">{section}</div><h1>{title}</h1><div class="gf-sub">{subtitle}</div>', unsafe_allow_html=True)


def card(label, value, note=""):
    st.markdown(f'<div class="gf-panel"><div class="gf-label">{label}</div><div class="gf-value">{value}</div><div class="gf-note">{note}</div></div>', unsafe_allow_html=True)


def empty(message, guidance=None):
    st.info(message)
    if guidance: st.caption(guidance)


def active_data():
    return st.session_state.get("dataset")


def available_models():
    models = dict(st.session_state.get("models", {}))
    for path in ModelArtifactService.available(ARTIFACT_DIR):
        name = path.stem.replace("_", " ").title()
        if name not in models:
            try:
                bundle = ModelArtifactService.load(path)
                models[name] = bundle["pipeline"]
                st.session_state.setdefault("model_features", {})[name] = bundle["features"]
            except Exception as exc:
                st.session_state.setdefault("artifact_errors", {})[name] = str(exc)
    if "features" in st.session_state:
        for name in st.session_state.get("models", {}): st.session_state.setdefault("model_features", {})[name] = st.session_state.features
    return models


def load_csv_upload(upload):
    frame = DatasetService.load_points(upload)
    return frame, "observed-label point CSV"


def overview_page():
    heading("Flood Intelligence Overview", "Geospatial data fusion and historical flood susceptibility analysis.")
    st.markdown('<div class="gf-panel"><b>Research scope</b><br><span class="gf-note">Historical susceptibility estimates only. This is not a real-time flood forecast or an official warning system.</span></div>', unsafe_allow_html=True)
    st.write("")
    data = active_data(); models = available_models()
    stats = PreprocessingService.stats(data) if data is not None and "flood_label" in data else None
    datasets = records()
    cols = st.columns(5)
    values = [("Historical observations", f"{stats['rows']:,}" if stats else "Unavailable", "Current processed table"),
              ("Registered datasets", str(len(datasets)), "Local catalog"),
              ("Fitted models", str(len(models)), "Loaded session and artifacts"),
              ("Study regions", "Unavailable", "No region inventory registered"),
              ("Model performance", "Unavailable", "Shown after evaluation")]
    for col, args in zip(cols, values):
        with col: card(*args)
    left, right = st.columns([1.2, 1])
    with left:
        st.subheader("Susceptibility distribution")
        prediction = st.session_state.get("last_prediction")
        if prediction:
            st.metric("Most recent combined estimate", prediction.get("category", "Unavailable"), f"{prediction.get('flood_probability', 0):.1%} probability" if prediction.get("flood_probability") is not None else None)
        else: empty("Unavailable — no prediction has been generated in this session.")
        st.subheader("Historical activity")
        events = activity()
        if events: st.dataframe(pd.DataFrame(events), use_container_width=True, hide_index=True)
        else: st.caption("No activity has been recorded yet.")
    with right:
        st.subheader("Data and model status")
        st.write(f"**Dataset:** {'Loaded in this session' if data is not None else 'Unavailable'}")
        st.write(f"**Model artifacts:** {len(ModelArtifactService.available(ARTIFACT_DIR))} found")
        st.write(f"**Data directory:** `{DATA_DIR}`")
        st.write("**Temporal coverage:** Source dependent; unavailable until dataset metadata is supplied.")
    st.caption("Sources: [Global Flood Database](https://developers.google.com/earth-engine/datasets/catalog/GLOBAL_FLOOD_DB_MODIS_EVENTS_V1) · [ESA WorldCover](https://esa-worldcover.org/en/data-access)")


def dataset_page():
    heading("Dataset Manager", "Register and inspect source data. Original uploads are retained without overwriting existing files.")
    upload = st.file_uploader("Upload CSV, GeoJSON, GeoTIFF, TIFF, or zipped Shapefile", type=["csv", "geojson", "json", "tif", "tiff", "zip", "parquet"])
    if upload and st.button("Register dataset", type="primary"):
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        name = Path(upload.name).name
        target = DATA_DIR / f"{Path(name).stem}_{uuid.uuid4().hex[:8]}{Path(name).suffix.lower()}"
        target.write_bytes(upload.getvalue())
        entry = {"name": name, "stored_as": target.name, "category": "Geospatial/tabular source", "format": target.suffix.lower().lstrip("."), "size_bytes": target.stat().st_size, "registered_at": datetime.now(timezone.utc).isoformat(), "status": "Registered"}
        inventory = records(); inventory.append(entry); (DATA_DIR / "catalog.json").write_text(json.dumps(inventory, indent=2))
        st.session_state["selected_dataset_path"] = str(target)
        log_activity("Dataset registered", name)
        st.success(f"Saved without replacing an existing file: {target}")
    inventory = records()
    if inventory:
        st.subheader("Dataset inventory")
        st.dataframe(pd.DataFrame(inventory), use_container_width=True, hide_index=True)
        names = [entry["name"] for entry in inventory]
        idx = st.selectbox("Inspect dataset", range(len(names)), format_func=lambda i: f"{names[i]} · {inventory[i]['registered_at'][:10]}")
        chosen = DATA_DIR / inventory[idx]["stored_as"]
        suffix = chosen.suffix.lower()
        if suffix == ".csv":
            try:
                frame = pd.read_csv(chosen)
                a,b,c=st.columns(3); a.metric("Rows",f"{len(frame):,}"); b.metric("Columns",str(len(frame.columns))); c.metric("Missing cells",f"{int(frame.isna().sum().sum()):,}")
                st.dataframe(frame.head(100), use_container_width=True, hide_index=True)
                st.write("**Column types**"); st.dataframe(pd.DataFrame({"column":frame.columns,"dtype":frame.dtypes.astype(str).values,"missing":frame.isna().sum().values}),use_container_width=True,hide_index=True)
                st.session_state["candidate_dataset"] = frame
                if {"latitude","longitude","flood_label","landcover"}.issubset(frame.columns) and st.button("Use as observed point dataset"):
                    data, source = load_csv_upload(chosen)
                    st.session_state.raw_dataset=data; st.session_state.data_source=source
                    log_activity("Dataset selected for analysis", chosen.name); st.success("Dataset loaded into the analysis session.")
            except Exception as exc: st.error(f"Could not inspect CSV: {exc}")
        elif suffix in {".tif", ".tiff"}:
            try:
                with chosen.open("rb") as source:
                    memory, ds = DatasetService.open_raster(source)
                st.json(DatasetService.raster_metadata(ds)); ds.close(); memory.close()
            except Exception as exc: st.error(f"Raster inspection failed. Check file integrity and CRS. Details: {exc}")
        elif suffix in {".geojson", ".json"}:
            try:
                import geopandas as gpd
                geo = gpd.read_file(chosen)
                st.write({"features":len(geo),"crs":str(geo.crs),"geometry types":geo.geom_type.value_counts().to_dict(),"bounds":geo.total_bounds.tolist() if len(geo) else None})
                st.dataframe(geo.head(100),use_container_width=True,hide_index=True)
            except Exception as exc: st.error(f"GeoJSON inspection failed. Check geometry and CRS. Details: {exc}")
        elif suffix == ".parquet":
            try:
                frame=pd.read_parquet(chosen);st.write({"rows":len(frame),"columns":len(frame.columns),"missing cells":int(frame.isna().sum().sum())});st.dataframe(frame.head(100),use_container_width=True,hide_index=True)
            except Exception as exc: st.error(f"Parquet inspection needs a supported parquet engine (pyarrow or fastparquet). Details: {exc}")
        elif suffix == ".zip":
            try:
                import geopandas as gpd
                geo=gpd.read_file(f"zip://{chosen}")
                st.write({"features":len(geo),"crs":str(geo.crs),"geometry types":geo.geom_type.value_counts().to_dict(),"bounds":geo.total_bounds.tolist() if len(geo) else None})
                st.dataframe(geo.head(100),use_container_width=True,hide_index=True)
            except Exception as exc: st.error(f"Shapefile ZIP inspection failed. Ensure it contains .shp, .shx, .dbf and .prj files. Details: {exc}")
        else:
            st.info(f"{suffix.upper()} registration is available. Preview/validation is not implemented for this format.")
    else: empty("No datasets are registered.", "Upload a source file above. Files are stored in the configured data directory.")


def processing_panel():
    if "raw_dataset" not in st.session_state:
        empty("Select a supported observed point CSV in Dataset Manager first.")
        return
    if st.button("Validate and prepare features", type="primary"):
        try:
            df, features=PreprocessingService.prepare(st.session_state.raw_dataset)
            st.session_state.dataset,st.session_state.features=df,features
            log_activity("Preprocessing completed",f"{len(df):,} observations")
            st.success("Prepared dataset from observed source records.")
        except Exception as exc: st.error(f"Dataset validation failed: {exc}")
    if active_data() is not None:
        df=active_data(); stats=PreprocessingService.stats(df)
        a,b,c,d=st.columns(4); a.metric("Rows",f"{stats['rows']:,}"); b.metric("Observed flood",f"{stats['flood']:,}"); c.metric("Observed non-flood",f"{stats['non_flood']:,}"); d.metric("Flood fraction",f"{stats['flood_fraction']:.1%}")
        st.caption("Features: " + ", ".join(st.session_state.features))
        st.dataframe(df.head(200),use_container_width=True,hide_index=True)


def history_page():
    heading("Historical Analysis", "Explore observed event labels in the registered study dataset.")
    processing_panel()
    df=active_data()
    if df is None: return
    a,b=st.columns(2)
    with a: st.plotly_chart(px.histogram(df,x="landcover",color="flood_label",barmode="group",template="plotly_dark",title="Observed labels by WorldCover class"),use_container_width=True)
    with b:
        counts=df.flood_label.value_counts().rename(index={0:"Observed non-flood",1:"Observed flood"}).rename_axis("Label").reset_index(name="Rows")
        st.plotly_chart(px.pie(counts,names="Label",values="Rows",hole=.55,template="plotly_dark",title="Observed class balance"),use_container_width=True)
    st.caption("Event dates and event-level comparisons are unavailable unless those fields are provided in the source dataset.")


def explorer_page():
    heading("Geospatial Explorer", "Inspect available coordinates and model-generated outputs. Map layers appear only when source data exists.")
    layers=[]
    df=active_data()
    if df is not None and {"latitude","longitude"}.issubset(df.columns): layers.append("Observed locations")
    pred=st.session_state.get("last_batch_predictions")
    if pred is not None: layers.append("Batch susceptibility predictions")
    if not layers:
        empty("No mappable geospatial layers are currently available.","Load observations or generate model predictions. No flood extent or susceptibility raster is fabricated.")
        return
    basemap=st.selectbox("Basemap",["OpenStreetMap","CartoDB dark","Terrain","Satellite imagery"])
    try:
        import folium
        from streamlit_folium import st_folium
        source=pred if pred is not None else df
        center=[float(source.latitude.mean()),float(source.longitude.mean())]
        fmap=folium.Map(location=center,zoom_start=7,tiles=None,control_scale=True)
        if basemap=="OpenStreetMap": folium.TileLayer("OpenStreetMap",name=basemap).add_to(fmap)
        elif basemap=="CartoDB dark": folium.TileLayer("CartoDB dark_matter",name=basemap).add_to(fmap)
        elif basemap=="Terrain": folium.TileLayer("https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",attr="OpenTopoMap",name=basemap).add_to(fmap)
        else: folium.TileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",attr="Esri",name=basemap).add_to(fmap)
        if df is not None and "Observed locations" in layers:
            group=folium.FeatureGroup(name="Observed locations")
            for _,row in df.head(2000).iterrows(): folium.CircleMarker([row.latitude,row.longitude],radius=3,color="#39D0DF",fill=True,tooltip="Observed dataset location").add_to(group)
            group.add_to(fmap)
        if pred is not None:
            pg=folium.FeatureGroup(name="Combined predictions")
            colors=["#16A34A","#84CC16","#FACC15","#F97316","#DC2626"]
            for _,row in pred.head(2000).iterrows():
                p=float(row.flood_probability); color=colors[min(4,int(p*5))]
                folium.CircleMarker([row.latitude,row.longitude],radius=5,color=color,fill=True,fill_color=color,tooltip=f"Combined probability: {p:.3f}").add_to(pg)
            pg.add_to(fmap)
        folium.LayerControl().add_to(fmap)
        map_state=st_folium(fmap,use_container_width=True,height=600)
        if map_state and map_state.get("last_clicked"):
            point=map_state["last_clicked"]
            st.caption(f"Selected location: {point['lat']:.6f}, {point['lng']:.6f}")
        st.caption("Only loaded point locations and generated model outputs are shown. Satellite imagery and raster values are unavailable unless corresponding datasets are added.")
    except ImportError: st.warning("Map dependencies are unavailable. Install folium and streamlit-folium.")


def model_page():
    heading("Model Laboratory", "Train through the existing model pipeline and inspect actual evaluation outputs.")
    processing_panel()
    if active_data() is None: return
    st.caption("Training uses the existing spatial holdout where feasible. This action may take several minutes.")
    if st.button("Train configured models",type="primary"):
        bar=st.progress(0); label=st.empty()
        try:
            models,metrics,best,validation=TrainingService.train(active_data(),st.session_state.features,str(ARTIFACT_DIR),lambda p,n:(bar.progress(p),label.write(f"Training {n}…")))
            st.session_state.models=models;st.session_state.metrics=metrics;st.session_state.best_model=best;st.session_state.validation=validation
            st.session_state.model_features={name:st.session_state.features for name in models}
            log_activity("Model training completed",f"{len(models)} models; selected {best}")
            st.success(f"Training completed. Selected by backend metric: {best}")
        except Exception as exc: st.error(f"Training could not complete. Check the ML environment and validation data. Details: {exc}")
    models=available_models(); errs=st.session_state.get("artifact_errors",{})
    if errs:
        with st.expander("Artifact load errors"):
            for name,error in errs.items():st.error(f"{name}: {error}")
    if models: st.write("**Available fitted models:** " + ", ".join(models))
    metrics=pd.DataFrame([r for r in st.session_state.get("metrics",[]) if "macro_f1" in r])
    if not metrics.empty:
        st.dataframe(metrics.drop(columns=["confusion_matrix"],errors="ignore"),use_container_width=True,hide_index=True)
        eligible=[row for row in st.session_state.metrics if "confusion_matrix" in row]
        if eligible:
            chosen=st.selectbox("Confusion matrix",[row["model"] for row in eligible],key="lab_confusion")
            cm=next(row["confusion_matrix"] for row in eligible if row["model"]==chosen)
            st.plotly_chart(px.imshow(cm,text_auto=True,x=["Predicted non-flood","Predicted flood"],y=["Observed non-flood","Observed flood"],template="plotly_dark",color_continuous_scale="Blues",title=f"{chosen} · confusion matrix"),use_container_width=True)
    else: st.caption("No actual evaluation metrics are available yet.")


def susceptibility_page():
    heading("Flood Susceptibility", "Combine at least two compatible fitted models into one historical susceptibility estimate.")
    models=available_models()
    if len(models)<2:
        empty(f"At least two fitted models are required; {len(models)} are currently available.","Train models in Model Laboratory or place backend-generated model bundles in the artifacts directory.")
        return
    selected=st.multiselect("Models to combine",list(models),default=[])
    if len(selected)<2: st.info("Choose two or more models to enable prediction."); return
    schemas=st.session_state.get("model_features",{})
    if any(schemas.get(name)!=schemas.get(selected[0]) for name in selected[1:]): st.error("Selected models have different feature schemas; choose compatible models."); return
    features=schemas[selected[0]]
    mode=st.radio("Prediction mode",["Single location","Batch CSV"],horizontal=True)
    cover={10:"Tree cover",20:"Shrubland",30:"Grassland",40:"Cropland",50:"Built-up",60:"Bare/sparse vegetation",70:"Snow/ice",80:"Permanent water",90:"Herbaceous wetland",95:"Mangroves",100:"Moss/lichen"}
    if mode=="Single location":
        with st.form("ensemble_prediction"):
            l,r=st.columns(2); lat=l.number_input("Latitude",-90.0,90.0,0.0,format="%.6f");lon=r.number_input("Longitude",-180.0,180.0,0.0,format="%.6f")
            lc=st.selectbox("WorldCover class",list(cover),format_func=lambda n:f"{n} — {cover[n]}")
            values={"latitude":lat,"longitude":lon,"landcover":lc}
            for i,f in enumerate(features):
                if f not in values and f not in {"built_up_pct","vegetation_pct","water_pct","cropland_pct"}:
                    value=st.text_input(f.replace("_"," ").title()) if f=="soil" else st.number_input(f.replace("_"," ").title(),value=0.0)
                    values[f]=value
            submitted=st.form_submit_button("Generate combined estimate",type="primary")
        if submitted:
            try:
                result=EnsemblePredictionService.predict([{"name":n,"pipeline":models[n]} for n in selected],values,features)
                st.session_state.last_prediction={**result,"category":"Higher susceptibility" if result["prediction"] else "Lower susceptibility","model_names":selected,"timestamp":datetime.now(timezone.utc).isoformat()}
                p=result["flood_probability"];st.metric("Combined susceptibility",st.session_state.last_prediction["category"],f"Mean model probability · {p:.1%}")
                log_activity("Combined prediction generated",f"{len(selected)} models")
                st.download_button("Download prediction CSV",pd.DataFrame([st.session_state.last_prediction]).to_csv(index=False).encode(),"geoflood_prediction.csv","text/csv")
            except Exception as exc:st.error(f"Prediction validation or inference failed: {exc}")
    else:
        upload=st.file_uploader("CSV with latitude, longitude, landcover and all additional required predictors",type=["csv"],key="batch_csv")
        if upload and st.button("Run batch ensemble",type="primary"):
            try:
                frame=pd.read_csv(upload)
                required={"latitude","longitude","landcover"}|{f for f in features if f not in {"built_up_pct","vegetation_pct","water_pct","cropland_pct"}}
                missing=required-set(frame.columns)
                if missing:raise ValueError("Missing required columns: "+", ".join(sorted(missing)))
                rows=[]
                for _,row in frame.iterrows():
                    vals=row.to_dict();rows.append(EnsemblePredictionService.predict([{"name":n,"pipeline":models[n]} for n in selected],vals,features))
                output=pd.concat([frame.reset_index(drop=True),pd.DataFrame(rows)[["prediction","flood_probability"]]],axis=1)
                st.session_state.last_batch_predictions=output
                st.dataframe(output.head(100),use_container_width=True,hide_index=True)
                st.download_button("Download batch results CSV",output.to_csv(index=False).encode(),"geoflood_batch_predictions.csv","text/csv")
                log_activity("Batch prediction generated",f"{len(output)} rows; {len(selected)} models")
            except Exception as exc:st.error(f"Batch prediction failed. Check coordinates, feature columns, and model schema. Details: {exc}")
    st.caption("Historical susceptibility estimate only; not a real-time forecast or official flood warning.")


def explain_page():
    heading("Explainable AI", "Inspect explanations produced by the existing model explanation service.")
    models=available_models(); data=active_data()
    if not models or data is None or "features" not in st.session_state:
        empty("A fitted model and processed validation dataset are required. No explanations are fabricated.");return
    name=st.selectbox("Model",list(models)); rows=st.session_state.get("validation",{}).get("X_test",data[st.session_state.features])
    if st.button("Compute explanation",type="primary"):
        try:
            explanation=ExplainabilityService.explain(models[name],rows)
            importance=ExplainabilityService.importance_table(explanation)
            st.session_state["explanation"]=(explanation,importance)
        except Exception as exc:st.error(f"Explanation unavailable: {exc}")
    if "explanation" in st.session_state:
        explanation,importance=st.session_state.explanation
        if importance.empty:st.warning(explanation.get("message","Explanation unavailable for this model."));return
        st.plotly_chart(px.bar(importance.head(20).sort_values("importance"),x="importance",y="feature",orientation="h",template="plotly_dark",title="Global feature contribution / importance"),use_container_width=True)
        st.caption("Explanations describe fitted model behavior and do not establish physical causality.")
        if explanation["kind"]=="shap":
            try:
                import matplotlib.pyplot as plt
                import shap
                transformed=models[name].named_steps["preprocess"].transform(rows.iloc[:len(explanation["values"])])
                fig,_=plt.subplots(figsize=(9,5));shap.summary_plot(explanation["values"],transformed,feature_names=explanation["feature_names"],show=False);st.pyplot(fig);plt.close(fig)
            except Exception as exc:st.warning(f"SHAP summary rendering failed: {exc}")


def analytics_page():
    heading("Analytics", "Visual summaries of actual dataset and model evaluation outputs.")
    df=active_data();metrics=pd.DataFrame([r for r in st.session_state.get("metrics",[]) if "macro_f1" in r])
    if df is not None:
        a,b=st.columns(2)
        with a:st.plotly_chart(px.histogram(df,x="landcover",color="flood_label",barmode="group",template="plotly_dark",title="Observed land-cover classes"),use_container_width=True)
        with b:
            numeric=[f for f in st.session_state.get("features",[]) if f in df and pd.api.types.is_numeric_dtype(df[f])]
            if numeric:st.plotly_chart(px.imshow(df[numeric].corr(),text_auto=".2f",template="plotly_dark",title="Predictor correlation"),use_container_width=True)
            else:empty("No numeric predictor columns are available.")
    else:empty("Dataset analytics unavailable until observed data are loaded.")
    if not metrics.empty:
        st.plotly_chart(px.bar(metrics.melt(id_vars="model",value_vars=[c for c in ["accuracy","macro_f1","flood_recall","roc_auc"] if c in metrics],var_name="Metric",value_name="Score"),x="model",y="Score",color="Metric",barmode="group",range_y=[0,1],template="plotly_dark",title="Actual held-out model metrics"),use_container_width=True)
        validation=st.session_state.get("validation",{})
        if "X_test" in validation and "y_test" in validation:
            try:
                from sklearn.metrics import roc_curve, precision_recall_curve
                fig=go.Figure(); pr=go.Figure()
                for name,model in st.session_state.get("models",{}).items():
                    if not hasattr(model,"predict_proba"): continue
                    prob=model.predict_proba(validation["X_test"])[:,1]
                    fpr,tpr,_=roc_curve(validation["y_test"],prob); fig.add_trace(go.Scatter(x=fpr,y=tpr,mode="lines",name=name))
                    precision,recall,_=precision_recall_curve(validation["y_test"],prob); pr.add_trace(go.Scatter(x=recall,y=precision,mode="lines",name=name))
                fig.add_trace(go.Scatter(x=[0,1],y=[0,1],mode="lines",name="Chance",line={"dash":"dash"}))
                fig.update_layout(template="plotly_dark",title="ROC curves · held-out observations",xaxis_title="False positive rate",yaxis_title="True positive rate")
                pr.update_layout(template="plotly_dark",title="Precision–recall curves · held-out observations",xaxis_title="Recall",yaxis_title="Precision")
                st.plotly_chart(fig,use_container_width=True);st.plotly_chart(pr,use_container_width=True)
            except Exception as exc:st.caption(f"Curves unavailable for the current validation environment: {exc}")
    else:st.caption("Model analytics unavailable until fitted evaluation outputs exist.")


def reports_page():
    heading("Reports", "Generate downloads from actual analysis outputs.")
    st.caption("Model evaluation PDF and CSV are implemented. Historical event, dataset-quality, map snapshot, and individual-prediction report templates are not yet available.")
    metrics=st.session_state.get("metrics",[]);data=active_data()
    if not metrics:empty("Model report unavailable until a model has been evaluated.");return
    names=[m["model"] for m in metrics if "macro_f1" in m]
    if not names:empty("No successful evaluation records are available.");return
    best=st.session_state.get("best_model",names[0]);st.write(f"Current evaluated model selection: **{best}**")
    if data is not None and st.button("Generate evaluation PDF",type="primary"):
        try:
            pdf=ReportService.evaluation_pdf(metrics,best,st.session_state.get("validation",{}).get("split_method","Unavailable"),PreprocessingService.stats(data))
            REPORT_DIR.mkdir(parents=True,exist_ok=True);st.download_button("Download evaluation report",pdf,"geoflood_evaluation.pdf","application/pdf")
            log_activity("Report generated","Model evaluation PDF")
        except Exception as exc:st.error(f"Report generation failed: {exc}")
    st.download_button("Download evaluation table CSV",pd.DataFrame([m for m in metrics if "macro_f1" in m]).drop(columns=["confusion_matrix"],errors="ignore").to_csv(index=False).encode(),"model_evaluation.csv","text/csv")


def settings_page():
    heading("Settings", "Project configuration and local environment diagnostics.")
    st.subheader("Project information")
    st.write("**GeoFlood AI** · Historical Flood Susceptibility Analysis Using Geospatial Data Fusion and Machine Learning")
    st.write("Version: 1.0 · Python:",sys.version.split()[0],"· Platform:",platform.platform())
    st.subheader("Storage directories")
    for name,path in [("Data",DATA_DIR),("Model artifacts",ARTIFACT_DIR),("Reports",REPORT_DIR),("Logs",LOG_DIR)]:st.write(f"**{name}:** `{path}` · {'available' if path.exists() else 'not created yet'}")
    st.caption("Override paths with GEOFLOOD_DATA_DIR, GEOFLOOD_ARTIFACT_DIR, GEOFLOOD_REPORT_DIR, and GEOFLOOD_LOG_DIR before launch.")
    st.subheader("Backend dependency status")
    import importlib.util
    deps=["pandas","numpy","geopandas","rasterio","sklearn","xgboost","catboost","shap","folium","streamlit_folium","plotly","joblib","reportlab"]
    st.dataframe(pd.DataFrame([{"package":name,"status":"available" if importlib.util.find_spec(name) else "not installed / optional"} for name in deps]),use_container_width=True,hide_index=True)
    st.metric("Registered datasets",len(records()));st.metric("Model artifacts",len(ModelArtifactService.available(ARTIFACT_DIR)))
    st.caption("No secrets or credentials are used by this application.")


with st.sidebar:
    st.markdown("<div style='font-size:1.45rem;font-weight:800;letter-spacing:-.04em'>🌊 GeoFlood <span style='color:#39D0DF'>AI</span></div><div style='color:#8EA5BD;font-size:.75rem;margin:.25rem 0 1rem'>GEOSPATIAL RESEARCH PLATFORM · v1.0</div>",unsafe_allow_html=True)
    page=st.radio("Navigation",PAGES,format_func=lambda p:f"{ICONS[PAGES.index(p)]}  {p}",label_visibility="collapsed",key="navigation")
    st.markdown("---")
    st.caption(f"Dataset: {'ready' if active_data() is not None else 'unavailable'}")
    st.caption(f"Models: {len(available_models())} fitted")
    st.caption("Historical analysis only · not a warning system")

ROUTES={"Overview":overview_page,"Geospatial Explorer":explorer_page,"Dataset Manager":dataset_page,
        "Historical Analysis":history_page,"Model Laboratory":model_page,"Flood Susceptibility":susceptibility_page,
        "Explainable AI":explain_page,"Analytics":analytics_page,"Reports":reports_page,"Settings":settings_page}
ROUTES[page]()
