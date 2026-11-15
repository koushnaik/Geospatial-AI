"""Interactive maps of model predictions only."""
import folium
from branca.colormap import LinearColormap

def prediction_map(df, prediction_column="predicted_probability", center=None):
    if df is None or df.empty: raise ValueError("No model-predicted locations to map")
    if prediction_column not in df: raise ValueError("Map input must include an explicit model prediction column")
    if center is None: center = [float(df.latitude.mean()), float(df.longitude.mean())]
    m = folium.Map(location=center, zoom_start=10, control_scale=True)
    colors = LinearColormap(["green", "yellow", "red"], vmin=0, vmax=1, caption="Model estimated flood susceptibility")
    for _, row in df.iterrows():
        p = float(row[prediction_column])
        folium.CircleMarker([row.latitude, row.longitude], radius=5, color=colors(p), fill=True,
                            fill_color=colors(p), fill_opacity=.75,
                            tooltip=f"Model probability: {p:.3f}").add_to(m)
    colors.add_to(m)
    return m
